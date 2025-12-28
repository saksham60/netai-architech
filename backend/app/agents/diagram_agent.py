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
    "Prefer flowchart LR or TB. Return only Mermaid code without fences."
)


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
    mermaid = response.content
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
