"use client";

import React, { useEffect, useState } from 'react';
import * as Y from 'yjs';

interface TitlePageProps {
  ydoc: Y.Doc;
}

export default function TitlePage({ ydoc }: TitlePageProps) {
  const [title, setTitle] = useState('');
  const [byline, setByline] = useState('written by');
  const [author, setAuthor] = useState('');
  const [basedOn, setBasedOn] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  useEffect(() => {
    const ymap = ydoc.getMap('title-page');

    const updateState = () => {
      setTitle(ymap.get('title') as string || '');
      setByline(ymap.get('byline') as string || 'written by');
      setAuthor(ymap.get('author') as string || '');
      setBasedOn(ymap.get('based_on') as string || '');
      setContactInfo(ymap.get('contact_info') as string || '');
    };

    updateState();

    ymap.observe(() => {
      updateState();
    });
  }, [ydoc]);

  const updateField = (field: string, value: string) => {
    const ymap = ydoc.getMap('title-page');
    ymap.set(field, value);
  };

  return (
    <div className="screenplay-editor shadow-[0_0_50px_rgba(0,0,0,0.5)] print:shadow-none print:bg-white flex justify-center py-12 mb-12 print:mb-0 print:py-0" style={{ pageBreakAfter: 'always' }}>
      <div className="w-[816px] min-h-[1056px] bg-white text-black font-mono text-[12pt] relative p-[96px] mx-auto box-border flex flex-col justify-between print:w-[8.5in] print:h-[8.5in] print:min-h-0 print:py-0 print:px-[1in]">
        
        {/* Top/Middle Section: Title & Author */}
        <div className="flex-1 flex flex-col items-center justify-center print:mt-0">
          <input
            type="text"
            value={title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="SCRIPT TITLE"
            className="w-full text-center bg-transparent border-none outline-none hover:bg-gray-100 focus:bg-gray-100 uppercase transition-colors"
          />
          
          <div className="h-8"></div>
          
          <input
            type="text"
            value={byline}
            onChange={(e) => updateField('byline', e.target.value)}
            placeholder="written by"
            className="w-full text-center bg-transparent border-none outline-none hover:bg-gray-100 focus:bg-gray-100 transition-colors"
          />
          
          <div className="h-8"></div>
          
          <input
            type="text"
            value={author}
            onChange={(e) => updateField('author', e.target.value)}
            placeholder="Author Name"
            className="w-full text-center bg-transparent border-none outline-none hover:bg-gray-100 focus:bg-gray-100 transition-colors"
          />
          
          <div className="h-16"></div>
          
          <textarea
            value={basedOn}
            onChange={(e) => updateField('based_on', e.target.value)}
            placeholder="based on..."
            rows={3}
            className="w-full text-center bg-transparent border-none outline-none hover:bg-gray-100 focus:bg-gray-100 resize-none overflow-hidden transition-colors"
          />
        </div>

        {/* Bottom Section: Contact Info & Draft Info */}
        <div className="w-full flex justify-between items-end mt-auto h-32">
          <textarea
            value={contactInfo}
            onChange={(e) => updateField('contact_info', e.target.value)}
            placeholder="Contact Information&#10;Name&#10;Phone&#10;Email"
            rows={5}
            className="w-1/2 bg-transparent border-none outline-none hover:bg-gray-100 focus:bg-gray-100 resize-none overflow-hidden text-left transition-colors whitespace-pre-wrap"
          />
          <div className="w-1/2 flex justify-end">
            <textarea
              placeholder=""
              rows={5}
              className="w-full bg-transparent border-none outline-none text-right resize-none pointer-events-none"
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}
