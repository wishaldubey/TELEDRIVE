'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileData } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { Download, FileIcon, FileImage, FileVideo, FileAudio, Send, Loader2 } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { formatBytes } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface FileCardProps {
  file: FileData;
}

export default function FileCard({ file }: FileCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showLargeFileDialog, setShowLargeFileDialog] = useState(false);
  const [sendingToTelegram, setSendingToTelegram] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  
  const { toast } = useToast();
  
  // Get file type color with enhanced colors
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'photo':
        return <FileImage className="h-16 w-16 text-primary" style={{ color: 'var(--primary)' }} />;
      case 'video':
        return <FileVideo className="h-16 w-16" style={{ color: 'var(--pink)' }} />;
      case 'audio':
        return <FileAudio className="h-16 w-16" style={{ color: 'var(--green)' }} />;
      default:
        return <FileIcon className="h-16 w-16" style={{ color: 'var(--cyan)' }} />;
    }
  };
  
  // Get file type badge color with enhanced colors
  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'photo':
        return 'bg-primary/20 text-primary';
      case 'video':
        return 'bg-pink/20' + ' style="color: var(--pink)"';
      case 'audio':
        return 'bg-green/20' + ' style="color: var(--green)"';
      default:
        return 'bg-cyan/20' + ' style="color: var(--cyan)"';
    }
  };
  
  const handleDownload = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/download/${file.file_id}`);
      
      if (response.status === 413) { // File too large
        setShowLargeFileDialog(true);
        setIsLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Create a blob URL and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = '';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+?)"/);
        if (filenameMatch) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }
      
      // Fallback if no filename found in header
      if (!filename) {
        // Fix: Use either caption without extension, or file_name without extension, or a fallback
        filename = file.caption || 
          (file.file_name ? file.file_name.replace(/\.[^/.]+$/, "") : `file_${file.file_id.substring(0, 8)}`);
        
        // Then add the extension if available
        if (file.file_extension) {
          filename += file.file_extension;
        }
      }
      
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error downloading file:', error);
      setIsLoading(false);
    }
  };
  
  const handleSendToTelegram = async () => {
    setSendingToTelegram(true);
    
    try {
      const response = await fetch(`/api/download/${file.file_id}?sendToTelegram=true`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Error: ${response.status}`);
      }
      
      // Close dialog on success
      setShowLargeFileDialog(false);
      toast({
        title: 'Success',
        description: 'File sent to Telegram successfully!',
      });
    } catch (error) {
      console.error('Error sending file to Telegram:', error);
      toast({
        title: 'Error',
        description: 'Failed to send file to Telegram.',
      });
    } finally {
      setSendingToTelegram(false);
    }
  };
  
  // Get file name from caption or use placeholder
  // Fix: Remove extension from filename if it already has the same extension as file_extension
  const getDisplayFileName = () => {
    let fileName = '';
    
    if (file.caption) {
      fileName = file.caption;
    } else if (file.file_name) {
      // If file_name already includes the extension that matches file_extension, use it as is
      if (file.file_extension && file.file_name.toLowerCase().endsWith(file.file_extension.toLowerCase())) {
        fileName = file.file_name;
      } else {
        fileName = file.file_name;
      }
    } else {
      fileName = `File_${file.file_id.substring(0, 8)}`;
    }
    
    return fileName;
  };
  
  const fileName = getDisplayFileName();
  const fileSize = file.file_size ? formatBytes(file.file_size) : 'Unknown size';
  
  // Check if thumbnail is available
  const hasThumbnail = !!file.thumb_file_id && !thumbnailError;
  // Use direct URL to thumbnail API
  const thumbnailUrl = hasThumbnail ? `/api/thumbnail/${file.file_id}?direct=true` : '';
  
  // Determine if the filename needs extension display
  const shouldShowExtension = () => {
    if (!file.file_extension) return false;
    
    // If filename already ends with the extension, don't show it again
    if (fileName.toLowerCase().endsWith(file.file_extension.toLowerCase())) {
      return false;
    }
    
    return true;
  };
  
  return (
    <>
      <Card className="w-full h-full transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 flex flex-col group hover-scale hover-glow">
        <CardHeader className="pb-2 space-y-0">
          <div className="flex items-center justify-between">
            <div className="w-full max-w-full pr-2 overflow-hidden" title={fileName}>
              <div className="truncate text-base font-medium">
                {fileName.length > 10 ? 
                  `${fileName.substring(0, 10)}...` : 
                  fileName
                }
                {shouldShowExtension() && (
                  <span className="text-muted-foreground">{file.file_extension}</span>
                )}
              </div>
            </div>
            <Badge 
              className="ml-1 flex-shrink-0" 
              dangerouslySetInnerHTML={{ 
                __html: `<span ${getFileTypeColor(file.file_type)}>${file.file_type}</span>` 
              }}
            />
          </div>
        </CardHeader>
        
        <CardContent className="pt-2 pb-0 flex-grow flex flex-col">
          <div className="flex items-center justify-center py-4 flex-grow">
            {hasThumbnail ? (
              <div className="relative w-full h-32 overflow-hidden rounded-md bg-card/50 group-hover:ring-1 group-hover:ring-primary/30 transition-all duration-300">
                <Image
                  src={thumbnailUrl}
                  alt={fileName}
                  fill
                  sizes="(max-width: 768px) 100vw, 300px"
                  className="object-contain transition-transform group-hover:scale-105 duration-500"
                  onError={() => setThumbnailError(true)}
                  unoptimized={true} // Skip Next.js image optimization
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMzMzMzMzMiLz48L3N2Zz4="
                />
              </div>
            ) : (
              <div className="flex items-center justify-center flex-grow transition-transform group-hover:scale-110 duration-300">
                {getFileIcon(file.file_type)}
              </div>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-2 flex justify-between items-center">
            <span className="truncate max-w-[70%]">{fileSize}</span>
            <span className="truncate">{formatDistanceToNow(new Date(file.date), { addSuffix: true })}</span>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-end pt-4 mt-auto">
          <Button 
            size="sm" 
            onClick={handleDownload}
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-[color:var(--chart-4)] hover:opacity-90 text-white shadow-md transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Downloading
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Large File Dialog */}
      <Dialog open={showLargeFileDialog} onOpenChange={setShowLargeFileDialog}>
        <DialogContent className="bg-card border border-border/40">
          <DialogHeader>
            <DialogTitle>File Too Large</DialogTitle>
            <DialogDescription>
              This file is larger than 20MB and cannot be downloaded directly through the web interface.
              You can receive it through Telegram instead.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 border border-border/20 rounded-md px-4 bg-background/50">
            <p className="text-sm font-medium">File Details:</p>
            <p className="text-sm text-muted-foreground truncate-text" title={fileName}>
              {fileName}
              {shouldShowExtension() && file.file_extension}
            </p>
            <p className="text-sm text-muted-foreground">{fileSize}</p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowLargeFileDialog(false)}
              disabled={sendingToTelegram}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendToTelegram}
              disabled={sendingToTelegram}
              className="bg-gradient-to-r from-primary to-[color:var(--chart-4)] hover:opacity-90 text-white shadow-md"
            >
              {sendingToTelegram ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to Telegram
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 