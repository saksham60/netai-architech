import re
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.llm.adapters import LLMAdapter


class DiagramState(TypedDict):
    requirements: str
    context: str
    constraints: list[str]
    mermaid: str
    summary: str


SYSTEM_PROMPT = (
    "You are a senior network architect. Generate a clear Mermaid flowchart diagram "
    "for the requested network architecture. Use industry-standard components and "
    "labels (edge routers, firewalls, load balancers, app tiers, databases, monitoring). "
    "Prefer flowchart LR or TB. Keep the diagram concise (about 30 nodes max) and "
    "avoid repeating identical blocks across multiple subgraphs. Do not include "
    "interface labels on links (e.g., Ethernet 1/1). IMPORTANT: all node IDs must be "
    "unique across the entire diagram. Use distinct prefixes per section (e.g., DC_, "
    "BO_, WAN_, WIFI_) so IDs never repeat. Do not use Mermaid port syntax like "
    "node:port. Return only Mermaid code without fences."
)

_NODE_DEF_RE = re.compile(r"(?P<id>[A-Za-z_][A-Za-z0-9_]*)\s*(\(|\[|\{)")


def _dedupe_ids(mermaid: str) -> str:
    lines = mermaid.splitlines()
    seen: set[str] = set()
    in_block = False
    block_map: dict[str, str] = {}
    output: list[str] = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("subgraph"):
            in_block = True
            block_map = {}
            output.append(line)
            continue
        if stripped == "end":
            in_block = False
            block_map = {}
            output.append(line)
            continue

        line_out = line
        if in_block and block_map:
            for old_id, new_id in block_map.items():
                line_out = re.sub(rf"\b{old_id}\b", new_id, line_out)

        def_ids = [match.group("id") for match in _NODE_DEF_RE.finditer(line_out)]
        for node_id in def_ids:
            if node_id in seen:
                suffix = 2
                new_id = f"{node_id}_{suffix}"
                while new_id in seen:
                    suffix += 1
                    new_id = f"{node_id}_{suffix}"
                line_out = re.sub(rf"\b{node_id}\b", new_id, line_out)
                if in_block:
                    block_map[node_id] = new_id
                seen.add(new_id)
            else:
                seen.add(node_id)

        output.append(line_out)

    return "\n".join(output)


def _strip_ports(mermaid: str) -> str:
    return re.sub(r"(?<=\\w):\\w+\\b", "", mermaid)


def _strip_edge_labels(mermaid: str) -> str:
    return re.sub(r"-->\|[^|]*\|>", "-->", mermaid)


def _sanitize_mermaid(mermaid: str) -> str:
    lines = [line.rstrip() for line in mermaid.splitlines() if line.strip()]

    def has_unbalanced_brackets(line: str) -> bool:
        pairs = [("[", "]"), ("(", ")"), ("{", "}")]
        return any(line.count(open_c) > line.count(close_c) for open_c, close_c in pairs)

    while lines and has_unbalanced_brackets(lines[-1]):
        lines.pop()

    open_subgraphs = 0
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("subgraph"):
            open_subgraphs += 1
        elif stripped == "end" and open_subgraphs > 0:
            open_subgraphs -= 1

    lines.extend(["end"] * open_subgraphs)
    return "\n".join(lines).strip()


def _build_user_prompt(state: DiagramState) -> str:
    constraints = "\n".join(f"- {item}" for item in state.get("constraints", []))
    extra_context = state.get("context", "")
    return (
        "Requirements:\n"
        f"{state['requirements']}\n\n"
        "Context:\n"
        f"{extra_context or 'None'}\n\n"
        "Constraints:\n"
        f"{constraints or 'None'}\n\n"
        "Output:\n"
        "Mermaid flowchart only."
    )


def _generate_diagram(state: DiagramState, llm: LLMAdapter) -> DiagramState:
    user_prompt = _build_user_prompt(state)
    response = llm.generate(SYSTEM_PROMPT, user_prompt)
    mermaid = _sanitize_mermaid(
        _strip_edge_labels(_strip_ports(_dedupe_ids(response.content)))
    )
    summary = (
        "Generated a network architecture diagram with industry-standard layers "
        "based on the provided requirements."
    )
    return {**state, "mermaid": mermaid, "summary": summary}


def build_graph(llm: LLMAdapter):
    graph = StateGraph(DiagramState)
    graph.add_node("generate", lambda state: _generate_diagram(state, llm))
    graph.set_entry_point("generate")
    graph.add_edge("generate", END)
    return graph.compile()
