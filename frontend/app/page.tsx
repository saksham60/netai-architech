"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";

type EquipmentItem = {
  id: string;
  name: string;
  manufacturer: string;
  type: string;
  ports: number;
  throughput: string;
  useCase: string;
  category: string;
};

type Message = {
  role: "user" | "ai";
  text: string;
};

type GeneratedArchitecture = {
  summary: string;
  recommendations: string[];
};

type MermaidAPI = {
  initialize: (config: { startOnLoad: boolean; theme?: string }) => void;
  render: (id: string, code: string) => Promise<{ svg: string }>;
};

const API_BASE_DEFAULT =
  process.env.NEXT_PUBLIC_API_BASE || "https://netai-architech.onrender.com";
// const API_BASE_DEFAULT = "http://localhost:3001";

const equipmentDatabase: Record<string, EquipmentItem[]> = {
  "Core Routing": [
    {
      id: "cisco-asr-9000",
      name: "Cisco ASR 9000",
      manufacturer: "Cisco",
      type: "Edge/Core Router",
      ports: 64,
      throughput: "1.2 Tbps",
      useCase: "Service Provider Edge",
      category: "Core Routing",
    },
    {
      id: "juniper-mx-480",
      name: "Juniper MX480",
      manufacturer: "Juniper",
      type: "Multiservice Router",
      ports: 48,
      throughput: "960 Gbps",
      useCase: "Service Provider Core",
      category: "Core Routing",
    },
    {
      id: "arista-7800r",
      name: "Arista 7800R",
      manufacturer: "Arista",
      type: "Router",
      ports: 192,
      throughput: "460 Gbps",
      useCase: "Carrier Core",
      category: "Core Routing",
    },
    {
      id: "nokia-7750-sr",
      name: "Nokia 7750 SR",
      manufacturer: "Nokia",
      type: "Service Router",
      ports: 80,
      throughput: "800 Gbps",
      useCase: "Service Provider Edge",
      category: "Core Routing",
    },
  ],
  "Data Center Switching": [
    {
      id: "cisco-nexus-9k",
      name: "Cisco Nexus 9000",
      manufacturer: "Cisco",
      type: "Data Center Switch",
      ports: 128,
      throughput: "400 Gbps",
      useCase: "Leaf/Spine",
      category: "Data Center Switching",
    },
    {
      id: "arista-7050",
      name: "Arista 7050",
      manufacturer: "Arista",
      type: "Switch",
      ports: 128,
      throughput: "400 Gbps",
      useCase: "Cloud Fabric",
      category: "Data Center Switching",
    },
    {
      id: "juniper-qfx5200",
      name: "Juniper QFX5200",
      manufacturer: "Juniper",
      type: "Switch",
      ports: 64,
      throughput: "200 Gbps",
      useCase: "Spine Tier",
      category: "Data Center Switching",
    },
    {
      id: "aruba-8400",
      name: "Aruba 8400",
      manufacturer: "HPE Aruba",
      type: "Campus Switch",
      ports: 96,
      throughput: "100 Gbps",
      useCase: "Enterprise Core",
      category: "Data Center Switching",
    },
  ],
  "Security": [
    {
      id: "palo-alto-7050",
      name: "Palo Alto PA-7050",
      manufacturer: "Palo Alto",
      type: "NGFW",
      ports: 20,
      throughput: "200 Gbps",
      useCase: "Data Center Security",
      category: "Security",
    },
    {
      id: "fortigate-6000",
      name: "FortiGate 6000",
      manufacturer: "Fortinet",
      type: "NGFW",
      ports: 24,
      throughput: "100 Gbps",
      useCase: "Enterprise Edge",
      category: "Security",
    },
    {
      id: "cisco-fpr-9300",
      name: "Cisco Firepower 9300",
      manufacturer: "Cisco",
      type: "NGFW",
      ports: 16,
      throughput: "150 Gbps",
      useCase: "Service Provider",
      category: "Security",
    },
    {
      id: "checkpoint-quantum",
      name: "Check Point Quantum",
      manufacturer: "Check Point",
      type: "NGFW",
      ports: 20,
      throughput: "180 Gbps",
      useCase: "Enterprise Security",
      category: "Security",
    },
  ],
  "SD-WAN": [
    {
      id: "cisco-viptela",
      name: "Cisco SD-WAN (Viptela)",
      manufacturer: "Cisco",
      type: "SD-WAN",
      ports: 8,
      throughput: "10 Gbps",
      useCase: "Branch Connectivity",
      category: "SD-WAN",
    },
    {
      id: "fortinet-sdwan",
      name: "Fortinet Secure SD-WAN",
      manufacturer: "Fortinet",
      type: "SD-WAN",
      ports: 12,
      throughput: "20 Gbps",
      useCase: "Secure Branch",
      category: "SD-WAN",
    },
    {
      id: "versa-flexvnx",
      name: "Versa FlexVNF",
      manufacturer: "Versa",
      type: "SD-WAN",
      ports: 16,
      throughput: "40 Gbps",
      useCase: "Enterprise WAN",
      category: "SD-WAN",
    },
    {
      id: "vmware-velocloud",
      name: "VMware VeloCloud",
      manufacturer: "VMware",
      type: "SD-WAN",
      ports: 8,
      throughput: "10 Gbps",
      useCase: "Global Branch",
      category: "SD-WAN",
    },
  ],
  "Wireless & 5G": [
    {
      id: "cisco-wifi-7",
      name: "Cisco Wi-Fi 7 APs",
      manufacturer: "Cisco",
      type: "Wi-Fi AP",
      ports: 2,
      throughput: "9.6 Gbps",
      useCase: "Enterprise Wi-Fi",
      category: "Wireless & 5G",
    },
    {
      id: "aruba-wi-fi-6e",
      name: "Aruba Wi-Fi 6E",
      manufacturer: "HPE Aruba",
      type: "Wi-Fi AP",
      ports: 2,
      throughput: "5.4 Gbps",
      useCase: "Campus Wi-Fi",
      category: "Wireless & 5G",
    },
    {
      id: "nokia-dac-5g",
      name: "Nokia DAC 5G",
      manufacturer: "Nokia",
      type: "5G Gateway",
      ports: 8,
      throughput: "10 Gbps",
      useCase: "Private 5G",
      category: "Wireless & 5G",
    },
    {
      id: "ericsson-private-5g",
      name: "Ericsson Private 5G",
      manufacturer: "Ericsson",
      type: "5G Gateway",
      ports: 12,
      throughput: "20 Gbps",
      useCase: "Industrial 5G",
      category: "Wireless & 5G",
    },
  ],
};

const tabs = [
  { id: "conversation", label: "AI Conversation" },
  { id: "equipment", label: "Equipment Selection" },
  { id: "upload", label: "File Upload" },
  { id: "visualization", label: "Architecture View" },
];

const starterMessages: Message[] = [
  {
    role: "ai",
    text: "Welcome to NetAI Architect. Describe your network requirements and I will design a diagram.",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("conversation");
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem[]>([]);
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mermaidCode, setMermaidCode] = useState("");
  const [mermaidSvg, setMermaidSvg] = useState("");
  const [generatedArchitecture, setGeneratedArchitecture] =
    useState<GeneratedArchitecture | null>(null);
  const [showApproval, setShowApproval] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [mermaidReady, setMermaidReady] = useState(false);
  const [apiBase, setApiBase] = useState(API_BASE_DEFAULT);
  const [apiDraft, setApiDraft] = useState(API_BASE_DEFAULT);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("NETAI_API_BASE");
    if (stored) {
      setApiBase(stored);
      setApiDraft(stored);
    }
  }, []);

  useEffect(() => {
    if (!mermaidReady || !mermaidCode) {
      setMermaidSvg("");
      return;
    }

    const mermaid = (window as typeof window & { mermaid?: MermaidAPI })
      .mermaid;
    if (!mermaid) {
      setMermaidSvg("<pre>Mermaid failed to load.</pre>");
      return;
    }

    mermaid.initialize({ startOnLoad: false, theme: "neutral" });
    const renderId = `netai-${Date.now()}`;
    mermaid
      .render(renderId, mermaidCode)
      .then(({ svg }: { svg: string }) => setMermaidSvg(svg))
      .catch(() => setMermaidSvg("<pre>Failed to render diagram.</pre>"));
  }, [mermaidCode, mermaidReady]);

  const equipmentCount = useMemo(
    () => selectedEquipment.length,
    [selectedEquipment],
  );

  const handleChatSubmit = () => {
    if (!input.trim()) return;
    const nextMessages: Message[] = [
      ...messages,
      { role: "user", text: input.trim() },
    ];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    const response = getSuggestedResponse(input.trim());
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "ai", text: response }]);
      setIsTyping(false);
    }, 600);
  };

  const handleEquipmentSelect = (item: EquipmentItem) => {
    if (selectedEquipment.find((existing) => existing.id === item.id)) return;
    setSelectedEquipment((prev) => [...prev, item]);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: `Added ${item.name}.` },
      { role: "ai", text: `${item.name} added to the design list.` },
    ]);
  };

  const handleEquipmentRemove = (id: string) => {
    setSelectedEquipment((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    const names = Array.from(files).map((file) => file.name);
    setUploadedFiles((prev) => [...prev, ...names]);
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: `Received ${names.length} file(s). I can use them as context for the design.`,
      },
    ]);
  };

  const generateArchitecture = async () => {
    const latestUser = [...messages].reverse().find((msg) => msg.role === "user");
    const requirements =
      latestUser?.text ||
      "Design a secure, highly available network architecture.";

    const equipmentSummary = selectedEquipment.length
      ? `Selected equipment: ${selectedEquipment.map((item) => item.name).join(", ")}.`
      : "No specific equipment selected.";

    setIsGenerating(true);
    try {
      const response = await fetch(`${apiBase}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements,
          context: equipmentSummary,
          constraints: [
            "Use industry-standard components",
            "Include security and monitoring",
            "Design for redundancy",
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status}`);
      }

      const data = await response.json();
      setMermaidCode(data.mermaid || "");
      setGeneratedArchitecture({
        summary: data.summary || "Architecture generated.",
        recommendations: [
          "Validate redundancy targets for core links",
          "Confirm monitoring coverage across regions",
          "Review firewall policies and segmentation",
        ],
      });
      setShowApproval(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Unable to reach the backend. Check the API base URL or restart the service.",
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = (approved: boolean) => {
    setShowApproval(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: approved
          ? "Architecture approved. You can export or iterate further."
          : "No problem. Share the changes you want and I will regenerate.",
      },
    ]);
  };

  const saveApiBase = () => {
    const trimmed = apiDraft.trim();
    if (!trimmed) return;
    setApiBase(trimmed);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("NETAI_API_BASE", trimmed);
    }
  };

  const downloadSvg = () => {
    if (!mermaidSvg) return;
    const blob = new Blob([mermaidSvg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "network-architecture.svg";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#e2e8f0,_transparent_55%)]">
      <Script
        src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"
        strategy="afterInteractive"
        onLoad={() => setMermaidReady(true)}
      />

      <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 text-white shadow-lg">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">
                N
              </div>
              <div>
                <h1 className="text-2xl font-semibold">NetAI Architect</h1>
                <p className="text-sm text-slate-200">
                  GenAI network architecture design studio
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-100">
              LLM Ready
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              Groq + LangGraph
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              {equipmentCount} selected
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl bg-white p-2 shadow-[var(--shadow)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="space-y-6">
            {activeTab === "conversation" && (
              <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">
                    AI Network Architect
                  </h2>
                  <p className="text-sm text-slate-500">
                    Share goals, constraints, and scale. I will respond with a
                    diagram-driven plan.
                  </p>
                </div>

                <div className="h-[360px] space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                  {messages.map((msg, index) => (
                    <div
                      key={`${msg.role}-${index}`}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                          msg.role === "user"
                            ? "bg-slate-900 text-white"
                            : "bg-white text-slate-700 shadow"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow">
                        Thinking...
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) =>
                      event.key === "Enter" ? handleChatSubmit() : null
                    }
                    placeholder="Describe the network architecture you need..."
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-400 focus:outline-none"
                  />
                  <button
                    onClick={handleChatSubmit}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}

            {activeTab === "equipment" && (
              <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Equipment Catalog
                  </h2>
                  <p className="text-sm text-slate-500">
                    Curated devices for building secure, scalable networks.
                  </p>
                </div>

                <div className="space-y-6">
                  {Object.entries(equipmentDatabase).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-slate-400">
                        {category}
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        {items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => handleEquipmentSelect(item)}
                            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-left transition hover:border-teal-400 hover:bg-white"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="text-base font-semibold text-slate-900">
                                {item.name}
                              </h4>
                              <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-800">
                                {item.manufacturer}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">
                              {item.type} · {item.useCase}
                            </p>
                            <div className="mt-3 flex justify-between text-xs text-slate-500">
                              <span>Ports: {item.ports}</span>
                              <span>{item.throughput}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "upload" && (
              <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">
                    Upload Existing Architecture
                  </h2>
                  <p className="text-sm text-slate-500">
                    Drag in PDFs, DOCX, or spreadsheets to provide context.
                  </p>
                </div>
                <div
                  className="flex h-48 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <p className="text-sm text-slate-500">
                    Click to upload files (PDF, DOCX, XLSX).
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  onChange={(event) => handleFileUpload(event.target.files)}
                />

                {uploadedFiles.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                    <h3 className="text-sm font-semibold text-slate-700">
                      Uploaded Files
                    </h3>
                    <ul className="mt-2 space-y-2 text-xs text-slate-600">
                      {uploadedFiles.map((file, index) => (
                        <li key={`${file}-${index}`}>{file}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "visualization" && (
              <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">
                      Architecture View
                    </h2>
                    <p className="text-sm text-slate-500">
                      Mermaid rendering of the generated diagram.
                    </p>
                  </div>
                  <button
                    onClick={downloadSvg}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-teal-400 hover:text-teal-700"
                  >
                    Download SVG
                  </button>
                </div>

                <div className="min-h-[420px] rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
                  {mermaidSvg ? (
                    <div
                      className="overflow-x-auto"
                      dangerouslySetInnerHTML={{ __html: mermaidSvg }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Generate a diagram to see it here.
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
              <h3 className="text-lg font-semibold text-slate-900">
                Selected Equipment
              </h3>
              <p className="text-xs text-slate-500">
                {equipmentCount} device(s) in this design.
              </p>

              <div className="mt-4 space-y-3">
                {selectedEquipment.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No devices selected yet.
                  </p>
                ) : (
                  selectedEquipment.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {item.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.useCase}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEquipmentRemove(item.id)}
                        className="text-xs font-semibold text-rose-500"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={generateArchitecture}
                disabled={isGenerating}
                className={`mt-5 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                  isGenerating
                    ? "bg-teal-300"
                    : "bg-teal-600 hover:bg-teal-500"
                }`}
              >
                {isGenerating ? "Generating..." : "Generate Architecture"}
              </button>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
              <h3 className="text-lg font-semibold text-slate-900">
                AI Agent Status
              </h3>
              <div className="mt-3 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>NLP Engine</span>
                  <span className="font-semibold text-emerald-600">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>LLM Core</span>
                  <span className="font-semibold text-emerald-600">Groq</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>LangGraph</span>
                  <span className="font-semibold text-emerald-600">
                    Orchestrated
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Models Ready</span>
                  <span className="font-semibold text-slate-700">
                    Multi-provider
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-[var(--shadow)]">
              <h3 className="text-lg font-semibold text-slate-900">
                API Configuration
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                Update the backend URL if you deploy elsewhere.
              </p>
              <input
                value={apiDraft}
                onChange={(event) => setApiDraft(event.target.value)}
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                placeholder="https://netai-architech.onrender.com"
              />
              <button
                onClick={saveApiBase}
                className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-400 hover:text-teal-700"
              >
                Save API Base
              </button>
              <p className="mt-2 text-xs text-slate-500">
                Current: {apiBase}
              </p>
            </div>
          </aside>
        </div>
      </main>

      {showApproval && generatedArchitecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">
              Architecture Approval
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {generatedArchitecture.summary}
            </p>

            <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-700">
                Recommendations
              </h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {generatedArchitecture.recommendations.map((rec) => (
                  <li key={rec}>- {rec}</li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => handleApprove(true)}
                className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
              >
                Approve Architecture
              </button>
              <button
                onClick={() => handleApprove(false)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Request Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getSuggestedResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes("data center")) {
    return "Consider a leaf-spine fabric with redundant firewalls, load balancers, and a dedicated monitoring stack.";
  }
  if (lower.includes("sd-wan") || lower.includes("branch")) {
    return "For distributed sites, combine SD-WAN with zero-trust segmentation and centralized monitoring.";
  }
  if (lower.includes("campus") || lower.includes("enterprise")) {
    return "A three-tier campus design with redundant cores and NAC coverage fits enterprise campus requirements.";
  }
  return "Share throughput targets, security needs, and availability goals. I will produce a diagram based on those inputs.";
}
