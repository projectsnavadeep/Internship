import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Upload, 
  Trash2, 
  Download, 
  File,
  FileSpreadsheet,
  Image,
  Star,
  Loader2,
  AlertCircle,
  ChevronDown
} from 'lucide-react';
import { getDocuments, uploadDocumentFile, createDocument, deleteDocument, updateDocument } from '@/lib/supabase';
import { toast } from 'sonner';

interface DocumentInterface {
  id: string;
  name: string;
  document_type: string;
  file_size: number;
  file_url: string;
  created_at: string;
  is_default: boolean;
}

interface DocumentsViewProps {
  userId?: string;
}

const documentIcons: Record<string, React.ReactNode> = {
  'pdf': <FileText size={32} strokeWidth={1.5} className="text-red-500" />,
  'doc': <FileText size={32} strokeWidth={1.5} className="text-apple-blue" />,
  'docx': <FileText size={32} strokeWidth={1.5} className="text-apple-blue" />,
  'xls': <FileSpreadsheet size={32} strokeWidth={1.5} className="text-green-500" />,
  'xlsx': <FileSpreadsheet size={32} strokeWidth={1.5} className="text-green-500" />,
  'jpg': <Image size={32} strokeWidth={1.5} className="text-purple-500" />,
  'jpeg': <Image size={32} strokeWidth={1.5} className="text-purple-500" />,
  'png': <Image size={32} strokeWidth={1.5} className="text-purple-500" />,
};

const documentTypes = ['Resume', 'Cover Letter', 'Transcript', 'Portfolio', 'Certificate', 'Other'];

export function DocumentsView({ userId }: DocumentsViewProps) {
  const [docs, setDocs] = useState<DocumentInterface[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDocType, setSelectedDocType] = useState('Resume');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userId) {
      loadDocs();
    } else {
      setIsLoading(false);
    }
  }, [userId]);

  const loadDocs = async () => {
    try {
      const data = await getDocuments(userId!);
      setDocs(data);
    } catch (err: any) {
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleUpload(files[0]);
    }
    // reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (file: File) => {
    if (!userId) {
      toast.error('Please log in to upload documents.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size exceeds 50MB limit.');
      return;
    }
    
    setIsUploading(true);
    try {
      if (!userId) throw new Error('Session expired. Please log in again.');

      console.log('Initiating upload for:', file.name, 'Size:', file.size);
      const { publicUrl, size } = await uploadDocumentFile(file, userId);
      console.log('Upload successful. Public URL:', publicUrl);
      
      // Use the user-selected document type, or auto-detect
      let docType = selectedDocType;
      if (docType === 'Resume' && !file.name.toLowerCase().includes('resume')) {
        // Keep the user's selection unless it's still the default and filename suggests otherwise
        if (file.name.toLowerCase().includes('cover')) docType = 'Cover Letter';
        else if (file.name.toLowerCase().includes('transcript')) docType = 'Transcript';
        else if (file.name.toLowerCase().includes('portfolio')) docType = 'Portfolio';
        else if (file.name.toLowerCase().includes('certificate') || file.name.toLowerCase().includes('cert')) docType = 'Certificate';
      }
      
      const newDoc = await createDocument({
        name: file.name,
        user_id: userId,
        document_type: docType,
        file_url: publicUrl,
        file_size: size,
        mime_type: file.type
      });
      
      setDocs(prev => [newDoc, ...prev]);
      toast.success(`Success: "${file.name}" is now stored as ${docType}.`);
    } catch (err: any) {
      console.error('CRITICAL UPLOAD FAILURE:', err);
      toast.error(`Upload Failed: ${err.message || 'Database connection error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleDefault = async (id: string) => {
    const targetDoc = docs.find(d => d.id === id);
    if (!targetDoc) return;
    
    const newStatus = !targetDoc.is_default;
    
    try {
      // First, update the local UI for speed
      setDocs(docs.map(doc => ({
        ...doc,
        is_default: doc.id === id ? newStatus : (newStatus ? false : doc.is_default)
      })));

      // If we are setting this doc as default, clear any others first (if that's the logic)
      // For now, just update the single record as the RLS might be complex
      await updateDocument(id, { is_default: newStatus });
      
      if (newStatus) {
        toast.success(`"${targetDoc.name}" is now marked as your primary document.`);
      }
    } catch (err) {
      toast.error('Failed to update document status.');
      loadDocs(); // Revert on failure
    }
  };

  const handleDeleteDocument = async (id: string, url: string) => {
    try {
      await deleteDocument(id, url);
      setDocs(docs.filter(doc => doc.id !== id));
      toast.success('Document deleted permanently.');
    } catch (err: any) {
      toast.error('Failed to delete document.');
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Show login prompt if no userId
  if (!userId) {
    return (
      <div className="space-y-12 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-left"
        >
          <h1 className="display-hero text-apple-near-black dark:text-white mb-2">Documents.</h1>
        </motion.div>
        <motion.div
          className="apple-card p-12 bg-white dark:bg-apple-near-black text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertCircle size={32} className="text-orange-500" />
          </div>
          <h3 className="section-heading text-apple-near-black dark:text-white mb-2">Sign in Required</h3>
          <p className="text-[17px] text-apple-near-black/40 dark:text-white/40 max-w-sm mx-auto">
            Please sign in to upload and manage your documents.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-left"
      >
        <h1 className="display-hero text-apple-near-black dark:text-white mb-2">Documents.</h1>
        <p className="text-[21px] text-apple-near-black/60 dark:text-white/60 tracking-apple-tight">
          Centralize your credentials and portfolio.
        </p>
      </motion.div>

      {/* Document Type Selector + Upload Zone */}
      <motion.div
        className={`
          apple-card p-12 bg-white dark:bg-apple-near-black border-2 border-dashed transition-all duration-500 apple-card-lift
          ${isDragging ? 'border-apple-blue bg-apple-blue/5 scale-[1.02]' : 'border-black/5 dark:border-white/5'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-apple-gray dark:bg-zinc-800 flex items-center justify-center mb-6 text-apple-blue shadow-inner group transition-transform">
             <Upload size={32} strokeWidth={1.5} className={isDragging ? 'animate-bounce' : ''} />
          </div>
          <h3 className="section-heading text-apple-near-black dark:text-white mb-2">
            {isDragging ? 'Drop to Store' : 'Repository Upload'}
          </h3>
          <p className="text-[17px] text-apple-near-black/40 dark:text-white/40 mb-6 max-w-sm">
            Support for PDF, DOCX, and high-resolution imagery. Max file size: 50MB.
          </p>

          {/* Document Type Selector */}
          <div className="relative mb-6">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-apple-gray dark:bg-zinc-800 text-[15px] font-medium text-apple-near-black dark:text-white hover:bg-apple-gray/80 dark:hover:bg-zinc-700 transition-colors"
            >
              <FileText size={16} />
              Document Type: {selectedDocType}
              <ChevronDown size={14} className={`transition-transform ${showTypeDropdown ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showTypeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-800 rounded-xl shadow-lg ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-20 min-w-[200px]"
                >
                  {documentTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => { setSelectedDocType(type); setShowTypeDropdown(false); }}
                      className={`w-full text-left px-4 py-2.5 text-[14px] font-medium transition-colors ${
                        selectedDocType === type
                          ? 'bg-apple-blue/10 text-apple-blue'
                          : 'text-apple-near-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            className="hidden" 
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt,.csv,.ppt,.pptx,.zip"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="apple-pill-filled px-10 flex items-center gap-2 disabled:opacity-50"
          >
            {isUploading && <Loader2 size={16} className="animate-spin" />}
            {isUploading ? 'Uploading...' : 'Upload from Desktop'}
          </button>
        </div>
      </motion.div>

      {isLoading && (
        <div className="flex justify-center py-20 text-apple-blue">
          <Loader2 size={32} className="animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && docs.length === 0 && (
        <motion.div
          className="apple-card p-12 bg-white dark:bg-apple-near-black text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-apple-gray dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-apple-near-black/20 dark:text-white/20" />
          </div>
          <h3 className="text-[19px] font-semibold text-apple-near-black dark:text-white mb-2">No documents yet</h3>
          <p className="text-[15px] text-apple-near-black/40 dark:text-white/40 max-w-xs mx-auto">
            Upload your resume, cover letters, transcripts, or certificates to get started.
          </p>
        </motion.div>
      )}

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {docs.map((doc, index) => (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
              className="apple-card bg-white dark:bg-apple-near-black p-8 apple-card-lift group"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-16 h-16 rounded-2xl bg-apple-gray dark:bg-zinc-800 flex items-center justify-center transition-transform group-hover:scale-110">
                  {documentIcons[doc.name.split('.').pop()?.toLowerCase() || ''] || <File size={32} className="text-apple-near-black/20" />}
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => toggleDefault(doc.id)}
                    className={`p-2 rounded-full transition-colors ${doc.is_default ? 'text-apple-blue' : 'text-apple-near-black/10'}`}
                  >
                    <Star size={20} fill={doc.is_default ? 'currentColor' : 'transparent'} />
                  </button>
                  <button 
                    onClick={() => handleDeleteDocument(doc.id, doc.file_url)}
                    className="p-2 rounded-full text-apple-near-black/10 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-[19px] font-bold text-apple-near-black dark:text-white truncate tracking-apple-tight">
                    {doc.name}
                  </h4>
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-[12px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest">{doc.document_type}</span>
                    <span className="w-1 h-1 rounded-full bg-apple-near-black/20" />
                    <span className="text-[12px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest">{formatSize(doc.file_size)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
                   <p className="text-[13px] font-medium text-apple-near-black/40">Uploaded {new Date(doc.created_at).toLocaleDateString()}</p>
                   <a 
                     href={doc.file_url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-apple-blue font-bold text-[14px] flex items-center gap-1 group"
                   >
                     View Document
                     <Download size={14} className="group-hover:translate-y-1 transition-transform" />
                   </a>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
