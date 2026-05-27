'use client';

import { useCallSheetStore } from '@/store/callSheetStore';
import { ChevronLeft, Download, FileImage, Printer, AlertTriangle } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';

export default function Preview() {
  const { setStep, projectInfo, locations, scenes, actors, crew, sections } = useCallSheetStore();
  const [isExporting, setIsExporting] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  
  // Set light theme for preview, restore dark on unmount
  useEffect(() => {
    document.body.style.backgroundColor = '#f3f4f6';
    document.body.style.color = '#111827';
    
    return () => {
      document.body.style.backgroundColor = '#0A0A0F';
      document.body.style.color = '#ffffff';
    };
  }, []);

  const handleDownloadPDF = async () => {
    setIsExporting(true);
    const loadingToast = toast.loading("Generating High-Res PDF...", { id: 'pdf-gen' });
    
    try {
      // Dynamic import to prevent SSR issues with html-to-image / jspdf
      const htmlToImage = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      if (!pdfRef.current) throw new Error("Reference missing");

      // Temporarily scale up for better resolution
      const element = pdfRef.current;
      const originalTransform = element.style.transform;
      element.style.transform = 'scale(2)';
      element.style.transformOrigin = 'top left';

      const dataUrl = await htmlToImage.toPng(element, {
        quality: 1,
        backgroundColor: '#ffffff',
        width: element.offsetWidth * 2,
        height: element.offsetHeight * 2,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left'
        }
      });
      
      element.style.transform = originalTransform; // Restore

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (element.offsetHeight * pdfWidth) / element.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${projectInfo.projectTitle.replace(/\s+/g, '_')}_CallSheet_Day${projectInfo.shootDayNumber}.pdf`);
      
      toast.success("PDF Downloaded successfully!", { id: loadingToast });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.", { id: loadingToast });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-gray-900 bg-gray-100">
      
      {/* Top Header Controls (Dark Theme) */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#111118] text-white shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setStep(2)}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Preview & Export</h1>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white px-4 py-2 rounded-md hover:bg-white/10 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          
          <button
            onClick={handleDownloadPDF}
            disabled={isExporting}
            className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-semibold py-2 px-6 rounded-md flex items-center gap-2 transition-colors text-sm shadow-[0_0_15px_rgba(245,166,35,0.2)] disabled:opacity-50"
          >
            {isExporting ? 'Generating...' : (
              <>
                <Download className="w-4 h-4" /> Download PDF
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        <div className="max-w-[210mm] mx-auto min-h-[297mm] bg-white shadow-2xl relative" style={{ boxSizing: 'border-box' }}>
          
          {/* Capture Area */}
          <div ref={pdfRef} className="bg-white p-8" style={{ width: '210mm', minHeight: '297mm' }}>
            
            {/* Call Sheet Header */}
            <div className="border-b-2 border-red-700 pb-4 mb-4 flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black uppercase text-gray-900 leading-none mb-1">CALL SHEET</h1>
                <h2 className="text-lg font-bold text-gray-700">{projectInfo.projectTitle}</h2>
                <p className="text-sm text-gray-500">{projectInfo.productionCompany} | Dir: {projectInfo.directorName}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-700">{projectInfo.shootDate}</div>
                <div className="text-sm font-bold text-gray-600">Day {projectInfo.shootDayNumber} of {projectInfo.totalShootDays}</div>
              </div>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-4 gap-4 bg-gray-100 p-4 border border-gray-300 rounded mb-6 text-sm">
              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase">General Call</span>
                <span className="font-bold text-lg">{projectInfo.generalCallTime}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase">Shoot Start</span>
                <span className="font-bold text-lg">{projectInfo.shootStartTime}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase">Est. Wrap</span>
                <span className="font-bold text-lg">{projectInfo.estimatedWrapTime}</span>
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-500 uppercase">Weather</span>
                <span className="font-bold block">{sections.weather.tempRange} • {sections.weather.description}</span>
              </div>
            </div>

            {/* Locations */}
            <div className="mb-6">
              <h3 className="bg-gray-800 text-white px-2 py-1 font-bold text-sm uppercase mb-2">Locations</h3>
              {locations.map((loc, idx) => (
                <div key={loc.id} className="text-sm mb-2 pl-2 border-l-2 border-gray-300">
                  <span className="font-bold">{loc.locationName}</span> — {loc.address}
                </div>
              ))}
            </div>

            {/* Main Tables Grid */}
            <div className="grid grid-cols-12 gap-6 mb-6">
              
              {/* Scenes */}
              <div className="col-span-7">
                <h3 className="bg-gray-800 text-white px-2 py-1 font-bold text-sm uppercase mb-2">Scenes To Shoot Today</h3>
                <table className="w-full text-xs border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-1 text-left w-12">Sc#</th>
                      <th className="border border-gray-300 p-1 text-left">Description</th>
                      <th className="border border-gray-300 p-1 text-center w-12">D/N</th>
                      <th className="border border-gray-300 p-1 text-center w-12">Pages</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenes.map(sc => (
                      <tr key={sc.id}>
                        <td className="border border-gray-300 p-1 font-bold text-center">{sc.sceneNumber}</td>
                        <td className="border border-gray-300 p-1">{sc.description}</td>
                        <td className="border border-gray-300 p-1 text-center">{sc.dayNight}</td>
                        <td className="border border-gray-300 p-1 text-center">{sc.pages}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actors */}
              <div className="col-span-5">
                <h3 className="bg-gray-800 text-white px-2 py-1 font-bold text-sm uppercase mb-2">Actors Required</h3>
                <table className="w-full text-xs border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 p-1 text-left">Actor</th>
                      <th className="border border-gray-300 p-1 text-center">Call Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actors.map(ac => (
                      <tr key={ac.id}>
                        <td className="border border-gray-300 p-1">
                          <span className="font-bold">{ac.actorName}</span>
                          <br/><span className="text-[10px] text-gray-500">as {ac.characterName}</span>
                        </td>
                        <td className="border border-gray-300 p-1 text-center font-bold">{ac.reportingTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* Crew */}
            <div className="mb-6">
              <h3 className="bg-gray-800 text-white px-2 py-1 font-bold text-sm uppercase mb-2">Key Crew Contacts</h3>
              <div className="grid grid-cols-2 gap-4">
                {crew.map(cr => (
                  <div key={cr.id} className="text-xs flex justify-between border-b border-gray-200 pb-1">
                    <span><span className="font-bold">{cr.roleTitle}</span>: {cr.name}</span>
                    <span className="text-gray-500">{cr.contactNumber}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Notes */}
            <div className="mt-8 border-t-2 border-red-700 pt-4">
              <h3 className="font-bold text-sm uppercase text-red-700 mb-2">Important Notes</h3>
              <ul className="list-disc pl-5 text-xs space-y-1">
                {sections.notes.bullets.map((note, i) => (
                  <li key={i}>{note}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
