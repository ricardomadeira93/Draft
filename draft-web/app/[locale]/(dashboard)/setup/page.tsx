"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Upload, CheckCircle2, Trash2, FileText, Loader2, FileType2 } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Setup");

  const [hasTemplate, setHasTemplate] = useState(false);
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [removingTemplate, setRemovingTemplate] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const token = await getToken();
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
      const [filesRes, templateRes] = await Promise.all([
        fetch(`${API_URL}/kb/files`, {
          cache: "no-store",
          headers: { "Authorization": `Bearer ${token}`, ...(orgId && { "X-Org-Id": orgId }) }
        }),
        fetch(`${API_URL}/template`, {
          cache: "no-store",
          headers: { "Authorization": `Bearer ${token}`, ...(orgId && { "X-Org-Id": orgId }) }
        })
      ]);
      const [filesData, templateData] = await Promise.all([filesRes.json(), templateRes.json()]);
      setKbFiles(filesData.files ?? []);
      setHasTemplate(templateData.has_template ?? false);
    } catch {
      // backend may not be running yet
    } finally {
      setLoadingFiles(false);
    }
  }, [getToken, orgId]);

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
            {t("title")}
          </p>
          <h1 className="text-3xl font-light tracking-tight text-foreground">
            Document Index
          </h1>
          <p className="text-muted-foreground mt-2 text-sm font-light max-w-xl">
            {t("subtitle")}
          </p>
        </div>

        {/* Upload Zone */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
              {t("upload_doc")}
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
            <p className="text-[11px] font-mono text-muted-foreground">{t("supported_formats")}</p>
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
            {t("indexed_documents")}
          </p>

          {loadingFiles ? (
            <div className="flex items-center gap-3 text-muted-foreground py-8">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span className="text-xs font-mono">{t("loading")}</span>
            </div>
          ) : kbFiles.length === 0 ? (
            <div className="bg-card p-12 text-center text-muted-foreground text-xs font-mono">
              {t("no_documents")}
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
        {/* Branded Template */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
              Branded DOCX Template
            </p>
            {hasTemplate && (
              <Button
                variant="ghost"
                size="sm"
                className="font-mono text-[10px] tracking-widest uppercase text-destructive hover:text-destructive hover:bg-transparent rounded-none h-auto py-0 px-0"
                onClick={async () => {
                  setRemovingTemplate(true);
                  try {
                    const token = await getToken();
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
                    await fetch(`${API_URL}/template`, {
                      method: "DELETE",
                      headers: { "Authorization": `Bearer ${token}`, ...(orgId && { "X-Org-Id": orgId }) }
                    });
                    setHasTemplate(false);
                    setTemplateFile(null);
                  } catch { alert("Failed to remove template."); }
                  finally { setRemovingTemplate(false); }
                }}
                disabled={removingTemplate}
              >
                {removingTemplate ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Remove template
              </Button>
            )}
          </div>

          <div className="bg-card p-6 space-y-4">
            {hasTemplate ? (
              <div className="flex items-center gap-3 text-primary">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p className="text-xs font-mono">Custom branded template active. DOCX exports will use your template.</p>
              </div>
            ) : (
              <p className="text-xs font-mono text-muted-foreground">
                Upload a <code className="bg-muted px-1">.docx</code> file with{" "}
                <code className="bg-muted px-1">{"{{Question}}"}</code>,{" "}
                <code className="bg-muted px-1">{"{{Answer}}"}</code>, and{" "}
                <code className="bg-muted px-1">{"{{Sources}}"}</code> placeholders.
                The AI will fill them in on each export.
              </p>
            )}

            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".docx"
                className="max-w-xs bg-transparent border-0 text-sm font-mono text-muted-foreground"
                onChange={e => setTemplateFile(e.target.files?.[0] || null)}
              />
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs tracking-widest uppercase rounded-none h-9 px-4 gap-2"
                onClick={async () => {
                  if (!templateFile) return;
                  setUploadingTemplate(true);
                  try {
                    const token = await getToken();
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
                    const fd = new FormData();
                    fd.append("file", templateFile);
                    const res = await fetch(`${API_URL}/template`, {
                      method: "POST",
                      body: fd,
                      headers: { "Authorization": `Bearer ${token}`, ...(orgId && { "X-Org-Id": orgId }) }
                    });
                    if (res.ok) { setHasTemplate(true); setTemplateFile(null); }
                    else alert("Upload failed.");
                  } catch { alert("Error uploading template."); }
                  finally { setUploadingTemplate(false); }
                }}
                disabled={!templateFile || uploadingTemplate}
              >
                {uploadingTemplate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileType2 className="h-3.5 w-3.5" />}
                {hasTemplate ? "Replace" : "Upload"}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
