import { useEffect, useState, useCallback } from 'react';

interface ImageMetadata {
  id: string;
  name: string;
  uploadedAt: string;
  original: string;
  thumbnail: string;
  sizes: {
    small: string;
    medium: string;
    large: string;
  };
  metadata: {
    width: number;
    height: number;
    size: number;
    format: string;
  };
}

interface ImagesCatalog {
  images: ImageMetadata[];
  updatedAt: string;
}

interface ImagePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
}

export function ImagePicker({ isOpen, onClose, onSelect }: ImagePickerProps) {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<'thumbnail' | 'small' | 'medium' | 'large' | 'original'>('medium');

  // Fetch images catalog
  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch images.json from blob storage via server redirect
      const response = await fetch('/data/images/images.json');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch images: ${response.statusText}`);
      }

      const catalog: ImagesCatalog = await response.json();
      setImages(catalog.images || []);
      setFilteredImages(catalog.images || []);
    } catch (err) {
      console.error('Error fetching images:', err);
      setError(err instanceof Error ? err.message : 'Failed to load images');
      setImages([]);
      setFilteredImages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch images when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchImages();
      setSearchQuery('');
    }
  }, [isOpen, fetchImages]);

  // Filter images based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredImages(images);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = images.filter((img) =>
      img.name.toLowerCase().includes(query) ||
      img.id.toLowerCase().includes(query)
    );
    setFilteredImages(filtered);
  }, [searchQuery, images]);

  const handleSelectImage = useCallback((image: ImageMetadata) => {
    let imageUrl: string;

    switch (selectedSize) {
      case 'thumbnail':
        imageUrl = image.thumbnail;
        break;
      case 'small':
        imageUrl = image.sizes.small;
        break;
      case 'medium':
        imageUrl = image.sizes.medium;
        break;
      case 'large':
        imageUrl = image.sizes.large;
        break;
      case 'original':
        imageUrl = image.original;
        break;
      default:
        imageUrl = image.sizes.medium;
    }

    onSelect(imageUrl);
    onClose();
  }, [selectedSize, onSelect, onClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-[fadeIn_0.2s]"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col animate-[slideUp_0.3s] m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Image Gallery</h2>
              <p className="text-sm text-gray-500">
                {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'} available
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 hover:rotate-90"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search and Size Selector */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search images by name..."
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
            />
          </div>

          {/* Size Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-700">Image Size:</label>
            <div className="flex gap-2">
              {(['thumbnail', 'small', 'medium', 'large', 'original'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${selectedSize === size
                      ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <svg className="w-12 h-12 text-purple-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-500 font-medium">Loading images...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 flex items-center gap-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-red-800">Error loading images</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button
                onClick={fetchImages}
                className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filteredImages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">
                {searchQuery ? 'No images found matching your search' : 'No images available'}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                >
                  Clear search
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredImages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => handleSelectImage(image)}
                  className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-purple-500 transition-all duration-200 hover:shadow-xl hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  <img
                    src={image.thumbnail}
                    alt={image.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                    <p className="text-white font-semibold text-sm truncate mb-1">
                      {image.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-300">
                      <span>{image.metadata.width}×{image.metadata.height}</span>
                      <span>{formatFileSize(image.metadata.size)}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(image.uploadedAt)}
                    </p>
                  </div>

                  {/* Select Icon */}
                  <div className="absolute top-2 right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>
              Select an image to use in your content
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
