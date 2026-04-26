"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Upload, CheckCircle2, Trash2, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";

interface KBFile {
  filename: string;
  chunk_count: number;
  uploaded_at: string;
}

export default function KnowledgeBase() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [kbFiles, setKbFiles] = useState<KBFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const { getToken, orgId } = useAuth();

  const fetchFiles = useCallback(async () => {
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/kb/files`, {
        cache: "no-store",
        headers: {
          "Authorization": `Bearer ${token}`,
          ...(orgId && { "X-Org-Id": orgId })
        }
      });
      const data = await res.json();
      setKbFiles(data.files ?? []);
    } catch {
      // backend may not be running yet
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setSuccessMsg("");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/upload-kb`, { 
        method: "POST", 
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`,
          ...(orgId && { "X-Org-Id": orgId })
        }
      });
      const data = await res.json();
      if (res.ok) { setSuccessMsg(data.message); setFile(null); await fetchFiles(); }
      else alert("Upload failed. Check server logs.");
    } catch {
      alert("Error connecting to the backend. Is FastAPI running?");
    } finally {
      setUploading(false);
    }
  };

  const handleUploadSample = async () => {
    setUploading(true);
    setSuccessMsg("");
    try {
      const res = await fetch("/samples/sample_knowledge.md");
      const blob = await res.blob();
      const sampleFile = new File([blob], "sample_knowledge.md", { type: "text/markdown" });
      
      const formData = new FormData();
      formData.append("file", sampleFile);
      
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const uploadRes = await fetch(`${API_URL}/upload-kb`, { 
        method: "POST", 
        body: formData,
        headers: {
          "Authorization": `Bearer ${token}`,
          ...(orgId && { "X-Org-Id": orgId })
        }
      });
      const data = await uploadRes.json();
      if (uploadRes.ok) { setSuccessMsg(data.message); await fetchFiles(); }
      else alert("Sample upload failed. Check server logs.");
    } catch {
      alert("Error uploading sample data. Is FastAPI running?");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    setDeletingFile(filename);
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/kb/files/${encodeURIComponent(filename)}`, { 
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          ...(orgId && { "X-Org-Id": orgId })
        }
      });
      if (res.ok) await fetchFiles();
      else { const data = await res.json(); alert(data.detail ?? "Delete failed."); }
    } catch {
      alert("Error connecting to the backend. Is FastAPI running?");
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto px-8 py-14 space-y-12">

        {/* Header */}
        <div>
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-primary mb-3">
            Knowledge Library
          </p>
          <h1 className="text-3xl font-light tracking-tight text-foreground">
            Document Index
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-light max-w-xl">
            Upload company policies, security docs, and past RFPs. The AI will securely index them to generate accurate answers.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
              Upload Document
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="font-mono text-[10px] tracking-widest uppercase text-primary hover:text-primary/80 rounded-none h-auto py-0 px-0 hover:bg-transparent"
              onClick={handleUploadSample}
              disabled={uploading}
            >
              Or load sample policy
            </Button>
          </div>
          <div className="bg-card p-8 text-center space-y-4">
            <Upload className="h-6 w-6 text-muted-foreground mx-auto" />
            <Input
              type="file"
              accept=".txt,.pdf,.md"
              className="max-w-xs mx-auto bg-transparent border-0 text-sm font-mono text-muted-foreground"
              onChange={(e) => { setSuccessMsg(""); setFile(e.target.files?.[0] || null); }}
            />
            <p className="text-[11px] font-mono text-muted-foreground">Accepts .txt, .md files</p>
          </div>

          {successMsg && (
            <div className="flex items-center gap-3 p-4 bg-card text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p className="text-xs font-mono">{successMsg}</p>
            </div>
          )}

          <Button
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase rounded-none h-10"
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Processing...</> : "Add to Library"}
          </Button>
        </div>

        {/* File Table */}
        <div className="space-y-4">
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
            Indexed Documents
          </p>

          {loadingFiles ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-xs font-mono">Loading index...</span>
            </div>
          ) : kbFiles.length === 0 ? (
            <div className="bg-card p-12 text-center text-muted-foreground text-xs font-mono">
              No documents indexed yet.
            </div>
          ) : (
            <div className="bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-0 hover:bg-transparent">
                    <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Document</TableHead>
                    <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Blocks</TableHead>
                    <TableHead className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">Added</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kbFiles.map((f) => (
                    <TableRow key={f.filename} className="border-0 hover:bg-accent/30">
                      <TableCell className="font-mono text-xs text-foreground">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-primary shrink-0" />
                          {f.filename}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs text-primary">{f.chunk_count}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {new Date(f.uploaded_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-transparent rounded-none"
                          onClick={() => handleDelete(f.filename)}
                          disabled={deletingFile === f.filename}
                        >
                          {deletingFile === f.filename ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
