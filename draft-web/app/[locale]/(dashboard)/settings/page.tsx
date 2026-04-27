"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Key, Plus, Trash2, Loader2, Copy, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface APIKey {
  id: string;
  name: string;
  created_at: string;
  last_used_at: string | null;
}

function NewKeyModal({ apiKey, onClose }: { apiKey: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card border border-border p-8 max-w-lg w-full mx-4 space-y-6">
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-2">New API Key Created</p>
          <h2 className="text-xl font-light text-foreground">Copy your key now</h2>
          <p className="text-xs text-muted-foreground mt-2 font-mono">
            This key will never be shown again. Store it in a secure location.
          </p>
        </div>

        <div className="bg-background border border-border p-4 flex items-center gap-3">
          <code className="flex-1 font-mono text-sm text-primary break-all">
            {visible ? apiKey : "dk_live_" + "•".repeat(48)}
          </code>
          <button onClick={() => setVisible(v => !v)} className="text-muted-foreground hover:text-foreground shrink-0">
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase rounded-none h-10 gap-2"
            onClick={copy}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy Key"}
          </Button>
          <Button
            variant="outline"
            className="font-mono text-xs tracking-widest uppercase rounded-none h-10 border-border"
            onClick={onClose}
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [keys, setKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const fetchKeys = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/api-keys`, { cache: "no-store" });
      const data = await res.json();
      setKeys(data.keys || []);
    } catch {
      // backend may not be running
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${API_URL}/api-keys`, { cache: "no-store" });
        const data = await res.json();
        if (!cancelled) {
          setKeys(data.keys || []);
        }
      } catch {
        // backend may not be running
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/api-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() })
      });
      const data = await res.json();
      setCreatedKey(data.key);
      setNewKeyName("");
      await fetchKeys();
    } catch { toast.error("Failed to create key", { description: "Please try again." }); }
    finally { setCreating(false); }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      await fetch(`${API_URL}/api-keys/${id}`, { method: "DELETE" });
      await fetchKeys();
    } catch { toast.error("Failed to revoke key", { description: "Please try again." }); }
    finally { setRevokingId(null); }
  };

  return (
    <>
      {createdKey && <NewKeyModal apiKey={createdKey} onClose={() => setCreatedKey(null)} />}

      <div className="min-h-screen bg-background">
        <main className="max-w-5xl mx-auto px-8 py-14 space-y-12">

          {/* Header */}
          <div>
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-3">Developer Access</p>
            <h1 className="text-3xl font-light tracking-tight text-foreground">API Keys</h1>
            <p className="text-muted-foreground mt-2 text-sm font-light max-w-xl">
              Use API keys to query your Knowledge Base programmatically or connect Draft to external tools like Claude Desktop via MCP.
            </p>
          </div>

          {/* Create new key */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Create New Key</p>
            <div className="flex gap-3">
              <Input
                placeholder="Key name (e.g. Claude Desktop, CI Pipeline)"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                className="font-mono text-sm rounded-none bg-card border-border focus-visible:ring-0 focus-visible:border-primary"
              />
              <Button
                onClick={handleCreate}
                disabled={!newKeyName.trim() || creating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase rounded-none h-10 px-6 gap-2 shrink-0"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Create
              </Button>
            </div>
          </div>

          {/* Key list */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Active Keys</p>
            <div className="bg-card">
              {loading ? (
                <div className="p-10 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : keys.length === 0 ? (
                <div className="p-10 text-center">
                  <Key className="h-5 w-5 text-muted-foreground mx-auto mb-3" />
                  <p className="font-mono text-xs text-muted-foreground">No API keys yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-0 hover:bg-transparent">
                      <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Name</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Created</TableHead>
                      <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Last Used</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map(k => (
                      <TableRow key={k.id} className="border-0 hover:bg-accent/30">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Key className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-mono text-sm text-foreground">{k.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {new Date(k.created_at + "Z").toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {k.last_used_at ? new Date(k.last_used_at + "Z").toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-transparent rounded-none"
                            onClick={() => handleRevoke(k.id)}
                            disabled={revokingId === k.id}
                          >
                            {revokingId === k.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* MCP instructions */}
          <div className="space-y-3">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">MCP Integration</p>
            <div className="bg-card p-6 space-y-4">
              <p className="text-sm text-muted-foreground font-light">
                Add Draft to Claude Desktop or any MCP-compatible client to query your Knowledge Base directly from your AI assistant.
              </p>
              <div className="bg-background border border-border p-4 overflow-x-auto">
                <pre className="font-mono text-xs text-foreground whitespace-pre">{`// claude_desktop_config.json
{
  "mcpServers": {
    "draft": {
      "url": "${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/mcp",
      "headers": {
        "Draft-API-Key": "dk_live_YOUR_KEY_HERE"
      }
    }
  }
}`}</pre>
              </div>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
