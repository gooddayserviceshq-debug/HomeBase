import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, Book, Shield, Wrench, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Document } from "@shared/schema";

export default function Documents() {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory !== "all" 
        ? `/api/documents?category=${selectedCategory}`
        : "/api/documents";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const categoryIcons = {
    guide: Book,
    warranty: Shield,
    manual: Wrench,
    spec: Info,
  };

  const categoryLabels = {
    guide: "Guides",
    warranty: "Warranty",
    manual: "Manuals",
    spec: "Specifications",
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Resource Library</h1>
        <p className="text-muted-foreground">
          Technical manuals, maintenance guides, and warranty documentation
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="mb-6">
          <TabsTrigger value="all" data-testid="tab-all">All Documents</TabsTrigger>
          <TabsTrigger value="guide" data-testid="tab-guide">Guides</TabsTrigger>
          <TabsTrigger value="manual" data-testid="tab-manual">Manuals</TabsTrigger>
          <TabsTrigger value="warranty" data-testid="tab-warranty">Warranty</TabsTrigger>
          <TabsTrigger value="spec" data-testid="tab-spec">Specifications</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : documents.length === 0 ? (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No documents found in this category</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((document) => {
                const Icon = categoryIcons[document.category as keyof typeof categoryIcons] || FileText;
                
                return (
                  <Card 
                    key={document.id} 
                    className="hover-elevate cursor-pointer" 
                    onClick={() => setSelectedDocument(document)}
                    data-testid={`card-document-${document.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <CardTitle className="text-lg">{document.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {document.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">
                          {categoryLabels[document.category as keyof typeof categoryLabels]}
                        </Badge>
                        <Button variant="ghost" size="sm" data-testid={`button-view-${document.id}`}>
                          View Document
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Document Viewer Dialog */}
      <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedDocument && (
                <>
                  {categoryIcons[selectedDocument.category as keyof typeof categoryIcons] && (
                    (() => {
                      const Icon = categoryIcons[selectedDocument.category as keyof typeof categoryIcons];
                      return <Icon className="w-5 h-5" />;
                    })()
                  )}
                  {selectedDocument.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedDocument?.description}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] pr-4">
            {selectedDocument?.content ? (
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(selectedDocument.content) }}
              />
            ) : selectedDocument?.fileUrl ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  This document is available as a downloadable file.
                </p>
                <Button data-testid="button-download">
                  <Download className="w-4 h-4 mr-2" />
                  Download Document
                </Button>
              </div>
            ) : (
              <p className="text-muted-foreground">No content available for this document.</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple markdown to HTML converter for display
function formatMarkdown(markdown: string): string {
  return markdown
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3 mt-6">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
    .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, '</p>')
    .replace(/<li/g, '<ul class="list-disc mb-4"><li')
    .replace(/<\/li>\n(?!<li)/g, '</li></ul>');
}