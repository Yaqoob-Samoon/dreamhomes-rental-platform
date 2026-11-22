import { useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageGalleryModal = ({ images, currentIndex, setCurrentIndex, onClose }) => {
  const closeButtonRef = useRef(null);

  const goPrev = () =>
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  const goNext = () =>
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));

  // Focus the close button on open (accessible entry point) and wire up
  // keyboard navigation: Escape closes, Left/Right arrows move the gallery.
  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Prevent the page behind the modal from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  if (!images || images.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Property image gallery"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center text-white z-10">
        <div className="font-medium text-sm tabular-nums" aria-live="polite">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          ref={closeButtonRef}
          onClick={onClose}
          aria-label="Close gallery"
          className="hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 p-2 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button
            onClick={goPrev}
            aria-label="Previous image"
            className="absolute left-4 md:left-8 hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 text-white p-3 rounded-full transition-colors z-10"
          >
            <ChevronLeft className="w-8 h-8" strokeWidth={1.5} />
          </button>
          <button
            onClick={goNext}
            aria-label="Next image"
            className="absolute right-4 md:right-8 hover:bg-white/10 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/60 text-white p-3 rounded-full transition-colors z-10"
          >
            <ChevronRight className="w-8 h-8" strokeWidth={1.5} />
          </button>
        </>
      )}

      {/* Active image — keyed on index so it re-triggers the fade on every change */}
      <img
        key={currentIndex}
        src={images[currentIndex].image_url}
        alt={`Property photo ${currentIndex + 1} of ${images.length}`}
        className="max-w-full max-h-[78vh] object-contain select-none animate-in fade-in duration-300"
      />

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="absolute bottom-0 w-full overflow-x-auto px-4 pb-5 pt-3">
          <div className="flex gap-2 justify-center min-w-max mx-auto">
            {images.map((img, index) => (
              <button
                key={img.id ?? index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === currentIndex}
                className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 transition-all focus:outline-none focus:ring-2 focus:ring-white/70 ${
                  index === currentIndex
                    ? 'ring-2 ring-white opacity-100'
                    : 'opacity-50 hover:opacity-80'
                }`}
              >
                <img
                  src={img.image_url}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageGalleryModal;