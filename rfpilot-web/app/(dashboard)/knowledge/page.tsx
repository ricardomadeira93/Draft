"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { ArrowLeft, Database, Upload, CheckCircle2, Trash2, FileText, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

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

  const fetchFiles = useCallback(async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/kb/files`);
      const data = await res.json();
      setKbFiles(data.files ?? []);
    } catch {
      // backend may not be running yet
    } finally {
      setLoadingFiles(false);
    }
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setSuccessMsg("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(`${API_URL}/upload-kb`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message);
        setFile(null);
        await fetchFiles();
      } else {
        alert("Upload failed. Check server logs.");
      }
    } catch {
      alert("Error connecting to the backend. Is FastAPI running?");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    setDeletingFile(filename);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const res = await fetch(
        `${API_URL}/kb/files/${encodeURIComponent(filename)}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        await fetchFiles();
      } else {
        const data = await res.json();
        alert(data.detail ?? "Delete failed.");
      }
    } catch {
      alert("Error connecting to the backend. Is FastAPI running?");
    } finally {
      setDeletingFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        {/* Page Title */}
        <div>
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-2">KNOWLEDGE LIBRARY</p>
          <h1 className="text-4xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Upload company policies, security docs, and past RFPs. The AI will securely index them to generate accurate answers later.
          </p>
        </div>

        {/* Upload Zone */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base font-medium">Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors p-10 text-center">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <Input
                type="file"
                accept=".txt,.pdf,.md"
                className="max-w-xs mx-auto"
                onChange={(e) => {
                  setSuccessMsg("");
                  setFile(e.target.files?.[0] || null);
                }}
              />
              <p className="text-xs text-muted-foreground mt-3">Accepts .txt, .md files</p>
            </div>

            {successMsg && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 flex items-center gap-3 text-green-400">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{successMsg}</p>
              </div>
            )}

            <Button
              className="w-full rounded-[1rem] bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
              ) : (
                "Add to Library"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* File Inventory Table */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Indexed Documents
          </h2>

          {loadingFiles ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading knowledge base...</span>
            </div>
          ) : kbFiles.length === 0 ? (
            <div className="border border-border p-12 text-center text-muted-foreground text-sm">
              No documents indexed yet. Upload a file above to get started.
            </div>
          ) : (
            <div className="border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead className="w-16 text-right">Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kbFiles.map((f) => (
                    <TableRow key={f.filename}>
                      <TableCell className="font-mono text-sm text-foreground">{f.filename}</TableCell>
                      <TableCell>
                        <span className="text-primary font-medium">{f.chunk_count}</span>
                        <span className="text-muted-foreground text-xs ml-1">blocks</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(f.uploaded_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDelete(f.filename)}
                          disabled={deletingFile === f.filename}
                        >
                          {deletingFile === f.filename ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
