'use client';

import { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { FileData } from '@/types';
import FileCard from './FileCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatBytes } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Download, Grid, List, Loader2, Search, Filter, SlidersHorizontal, ChevronDown, FileImage, FileVideo, FileAudio, FileIcon } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';

interface FileGridProps {
  files: FileData[];
  totalFiles: number;
  currentPage: number;
}

// Number of items per page
const ITEMS_PER_PAGE = 20;

export default function FileGrid({ files, totalFiles, currentPage }: FileGridProps) {
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isDownloading, setIsDownloading] = useState<Record<string, boolean>>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Add animation class when files change
  useEffect(() => {
    const fileCards = document.querySelectorAll('.file-card');
    fileCards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('file-card-visible');
      }, 50 * index);
    });
  }, [files, viewMode]);

  // Filter files based on search query and file type
  const filteredFiles = files.filter((file) => {
    const matchesSearch = 
      (file.caption?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       file.file_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       !searchQuery);

    const matchesType = filterType === 'all' || file.file_type === filterType;

    return matchesSearch && matchesType;
  });

  // Handle search input change
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  // Execute search on Enter key press
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setSearchQuery(inputValue);
    }
  };

  // Execute search on button click
  const handleSearchClick = () => {
    setSearchQuery(inputValue);
  };

  // Clear search
  const clearSearch = () => {
    setInputValue('');
    setSearchQuery('');
    setFilterType('all');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Calculate total pages
  const totalPages = Math.ceil(totalFiles / ITEMS_PER_PAGE);

  // Handle file download from list view
  const handleDownload = async (file: FileData) => {
    setIsDownloading({...isDownloading, [file._id]: true});
    
    try {
      const response = await fetch(`/api/download/${file.file_id}`);
      
      if (!response.ok) {
        if (response.status === 413) {
          // Handle large file
          alert('File too large to download directly. Use the file card view to send to Telegram.');
        } else {
          throw new Error(`Error: ${response.status}`);
        }
        return;
      }
      
      // Create a blob URL and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // Get filename
      const filename = file.caption || file.file_name || `file_${file.file_id.substring(0, 8)}`;
      
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    } finally {
      setIsDownloading({...isDownloading, [file._id]: false});
    }
  };
  
  // Get file type badge color
  const getFileTypeColor = (fileType: string) => {
    switch (fileType) {
      case 'photo':
        return 'bg-primary/20 text-primary';
      case 'video':
        return 'bg-pink/20 text-pink style="color: var(--pink); background-color: rgba(var(--pink, 244, 114, 182) / 0.2);"';
      case 'audio':
        return 'bg-green/20 text-green style="color: var(--green); background-color: rgba(var(--green, 34, 197, 94) / 0.2);"';
      case 'document':
        return 'bg-cyan/20 text-cyan style="color: var(--cyan); background-color: rgba(var(--cyan, 6, 182, 212) / 0.2);"';
      default:
        return 'bg-orange/20 text-orange style="color: var(--orange, 249, 115, 22); background-color: rgba(var(--orange, 249, 115, 22) / 0.2);"';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search Bar with animated border */}
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-pink/40 to-cyan/40 rounded-lg blur-sm opacity-70 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative bg-card/90 rounded-lg border border-border/40 flex overflow-hidden">
          <Input
            placeholder="Search files..."
              value={inputValue}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
              ref={searchInputRef}
              className="border-0 bg-transparent w-full px-4 py-2 h-11 focus:ring-0 shadow-none"
            />
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleSearchClick}
              className="h-11 w-11 bg-primary/10 hover:bg-primary/20 rounded-none border-l border-border/40"
            >
              <Search size={18} className="text-primary" />
            </Button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex gap-2">
          {/* Filter dropdown */}
          <div className="relative">
            <Button 
              variant="outline" 
              className="flex gap-2 h-11 bg-card/90 hover:bg-card border-border/40 hover:border-border/60 min-w-[120px]"
              onClick={() => setFilterOpen(!filterOpen)}
            >
              <Filter size={16} className={filterType !== 'all' ? 'text-primary' : ''} />
              <span className="capitalize">{filterType === 'all' ? 'All Types' : filterType + 's'}</span>
              <ChevronDown size={16} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </Button>
            
            {filterOpen && (
              <div className="absolute top-full mt-1 right-0 w-48 bg-card border border-border/40 rounded-lg shadow-lg p-1 z-10 animate-fadeIn">
                <Button 
                  variant={filterType === 'all' ? 'default' : 'ghost'} 
                  className="w-full justify-start text-sm mb-1"
                  onClick={() => {
                    setFilterType('all');
                    setFilterOpen(false);
                  }}
                >
                  All Types
                </Button>
                <Button 
                  variant={filterType === 'document' ? 'default' : 'ghost'} 
                  className="w-full justify-start text-sm mb-1"
                  onClick={() => {
                    setFilterType('document');
                    setFilterOpen(false);
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-cyan mr-2"></div>
                  Documents
                </Button>
                <Button 
                  variant={filterType === 'photo' ? 'default' : 'ghost'} 
                  className="w-full justify-start text-sm mb-1"
                  onClick={() => {
                    setFilterType('photo');
                    setFilterOpen(false);
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                  Photos
                </Button>
                <Button 
                  variant={filterType === 'video' ? 'default' : 'ghost'} 
                  className="w-full justify-start text-sm mb-1"
                  onClick={() => {
                    setFilterType('video');
                    setFilterOpen(false);
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-pink mr-2" style={{backgroundColor: 'var(--pink)'}}></div>
                  Videos
                </Button>
                <Button 
                  variant={filterType === 'audio' ? 'default' : 'ghost'} 
                  className="w-full justify-start text-sm"
                  onClick={() => {
                    setFilterType('audio');
                    setFilterOpen(false);
                  }}
                >
                  <div className="w-2 h-2 rounded-full bg-green mr-2" style={{backgroundColor: 'var(--green)'}}></div>
                  Audio
                </Button>
              </div>
            )}
          </div>
          
          {/* View mode toggle */}
          <div className="flex rounded-lg border border-border/40 bg-card/90 overflow-hidden">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => setViewMode('grid')}
              className="rounded-none h-11 w-11"
            >
              <Grid size={18} className={viewMode === 'grid' ? 'text-primary' : ''} />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="icon" 
              onClick={() => setViewMode('list')}
              className="rounded-none h-11 w-11 border-l border-border/40"
            >
              <List size={18} className={viewMode === 'list' ? 'text-primary' : ''} />
            </Button>
          </div>
        </div>
      </div>

      {/* Show active search/filter indicator */}
      {(searchQuery || filterType !== 'all') && (
        <div className="flex items-center justify-between bg-card/40 border border-border/40 rounded-lg p-3 px-4 backdrop-blur-sm animate-fadeIn">
          <div className="flex items-center gap-3 flex-wrap">
            {searchQuery && (
              <Badge variant="outline" className="px-3 py-1 gap-2 bg-primary/10 border-primary/30 text-primary flex items-center">
                <Search size={14} />
                <span>{searchQuery}</span>
              </Badge>
            )}
            {filterType !== 'all' && (
              <Badge 
                variant="outline" 
                className="px-3 py-1 gap-2 capitalize flex items-center"
                style={{
                  backgroundColor: `var(--${filterType === 'document' ? 'cyan' : filterType === 'photo' ? 'primary' : filterType === 'video' ? 'pink' : 'green'})/0.1`,
                  borderColor: `var(--${filterType === 'document' ? 'cyan' : filterType === 'photo' ? 'primary' : filterType === 'video' ? 'pink' : 'green'})/0.3`,
                  color: `var(--${filterType === 'document' ? 'cyan' : filterType === 'photo' ? 'primary' : filterType === 'video' ? 'pink' : 'green'})`,
                }}
              >
                <Filter size={14} />
                <span>{filterType}s</span>
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={clearSearch} className="h-7 px-3">
            Clear All
          </Button>
        </div>
      )}

      {filteredFiles.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredFiles.map((file) => (
                <div key={file._id} className="file-card opacity-0 transition-all duration-300 transform translate-y-4">
                  <FileCard file={file} />
                </div>
          ))}
        </div>
          ) : (
            // List View
            <div className="rounded-lg border border-border/40 overflow-hidden bg-card/60">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-primary/5 bg-primary/10">
                    <TableHead className="w-[300px] font-medium text-foreground">Name</TableHead>
                    <TableHead className="font-medium text-foreground">Type</TableHead>
                    <TableHead className="font-medium text-foreground">Size</TableHead>
                    <TableHead className="font-medium text-foreground">Date</TableHead>
                    <TableHead className="text-right font-medium text-foreground">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file, index) => {
                    // Get file name from caption or use placeholder
                    const fileName = file.caption || file.file_name || `File_${file.file_id.substring(0, 8)}`;
                    const fileSize = file.file_size ? formatBytes(file.file_size) : 'Unknown size';
                    
                    return (
                      <TableRow 
                        key={file._id} 
                        className={`hover:bg-primary/5 file-card opacity-0 transition-all duration-300 transform translate-y-4 ${index % 2 === 0 ? 'bg-card/40' : 'bg-card/20'}`}
                      >
                        <TableCell className="font-medium py-3">
                          <div className="truncate-text max-w-[300px] flex items-center gap-3" title={fileName}>
                            <div 
                              className="w-8 h-8 rounded-full flex items-center justify-center"
                              style={{
                                backgroundColor: `var(--${file.file_type === 'document' ? 'cyan' : file.file_type === 'photo' ? 'primary' : file.file_type === 'video' ? 'pink' : 'green'})/0.2`
                              }}
                            >
                              {file.file_type === 'photo' && <FileImage size={14} className="text-primary" />}
                              {file.file_type === 'video' && <FileVideo size={14} style={{color: 'var(--pink)'}} />}
                              {file.file_type === 'audio' && <FileAudio size={14} style={{color: 'var(--green)'}} />}
                              {file.file_type === 'document' && <FileIcon size={14} style={{color: 'var(--cyan)'}} />}
                            </div>
                            <span className="font-medium">{fileName}</span>
                            {file.file_extension && !fileName.toLowerCase().endsWith(file.file_extension.toLowerCase()) && (
                              <span className="text-muted-foreground">{file.file_extension}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className="capitalize"
                            dangerouslySetInnerHTML={{ 
                              __html: `<span ${getFileTypeColor(file.file_type)}>${file.file_type}</span>` 
                            }}
                          />
                        </TableCell>
                        <TableCell>{fileSize}</TableCell>
                        <TableCell>
                          {formatDistanceToNow(new Date(file.date), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDownload(file)}
                            disabled={isDownloading[file._id]}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            {isDownloading[file._id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-10">
              <div className="inline-flex rounded-lg border border-border/40 bg-card/40 backdrop-blur-sm p-1">
                {/* Previous Page Button */}
                {currentPage > 1 && (
                  <Link href={`/dashboard?page=${currentPage - 1}`}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                      Previous
                    </Button>
                  </Link>
                )}
                
                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show first page, last page, current page and pages around current
                    return page === 1 || 
                           page === totalPages || 
                           (page >= currentPage - 1 && page <= currentPage + 1);
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there are gaps
                    if (index > 0 && page - array[index - 1] > 1) {
                      return (
                        <div key={`ellipsis-${page}`} className="flex items-center">
                          <span className="px-2 text-muted-foreground">...</span>
                          <Link href={`/dashboard?page=${page}`}>
                            <Button 
                              variant={currentPage === page ? 'default' : 'ghost'} 
                              size="sm"
                              className={currentPage === page ? 
                                'bg-gradient-to-r from-primary to-pink text-white' : 
                                'hover:text-primary hover:bg-primary/10'}
                            >
                              {page}
                            </Button>
                          </Link>
                        </div>
                      );
                    }
                    
                    return (
                      <Link key={page} href={`/dashboard?page=${page}`}>
                        <Button 
                          variant={currentPage === page ? 'default' : 'ghost'} 
                          size="sm"
                          className={currentPage === page ? 
                            'bg-gradient-to-r from-primary to-pink text-white' : 
                            'hover:text-primary hover:bg-primary/10'}
                        >
                          {page}
                        </Button>
                      </Link>
                    );
                  })}
                
                {/* Next Page Button */}
                {currentPage < totalPages && (
                  <Link href={`/dashboard?page=${currentPage + 1}`}>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 border border-border/40 rounded-xl bg-card/20 backdrop-blur-sm animate-fadeIn">
          <div className="bg-primary/10 h-20 w-20 flex items-center justify-center rounded-full mx-auto mb-4">
            <SlidersHorizontal size={30} className="text-primary/80" />
          </div>
          <p className="text-lg text-foreground mb-2">No files found</p>
          <p className="text-muted-foreground mb-5 max-w-md mx-auto">
            {searchQuery || filterType !== 'all' ? 
              "We couldn't find any files matching your filters." :
              "There are no files in your account yet."
            }
          </p>
          {searchQuery || filterType !== 'all' ? (
            <Button 
              variant="outline" 
              onClick={clearSearch}
              className="mt-2 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
} 