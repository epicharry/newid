import React from 'react';

interface EmbedViewerProps {
  embedData: {
    content: string;
    width: number;
    height: number;
  };
  theme: 'light' | 'dark' | 'off';
}

export function EmbedViewer({ embedData, theme }: EmbedViewerProps) {
  // Decode HTML entities in the embed content
  const decodeHtmlEntities = (text: string): string => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  };

  const decodedContent = decodeHtmlEntities(embedData.content);

  // Calculate responsive dimensions that fit within viewport
  const maxWidth = Math.min(embedData.width, window.innerWidth - 64);
  const maxHeight = Math.min(embedData.height, window.innerHeight - 64);
  
  // Maintain aspect ratio while fitting in container
  const aspectRatio = embedData.width / embedData.height;
  let finalWidth = maxWidth;
  let finalHeight = maxWidth / aspectRatio;
  
  if (finalHeight > maxHeight) {
    finalHeight = maxHeight;
    finalWidth = maxHeight * aspectRatio;
  }
  return (
    <div
      className="relative w-full h-full flex items-center justify-center p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{
          width: `${finalWidth}px`,
          height: `${finalHeight}px`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        dangerouslySetInnerHTML={{ __html: decodedContent }}
      />
    </div>
  );
}