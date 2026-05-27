'use client';

import { useCallSheetStore, initialProjectInfo, initialSections } from '@/store/callSheetStore';
import ProjectSetup from '@/components/studio/call-sheet/ProjectSetup';
import Editor from '@/components/studio/call-sheet/Editor';
import Preview from '@/components/studio/call-sheet/Preview';
import { useEffect, Suspense } from 'react';
import { FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

function CallSheetContent() {
  const { currentStep, setStep, updateProjectInfo, setLocations, setScenes, setActors, setCrew, setAllSections } = useCallSheetStore();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      toast.loading("Loading call sheet...", { id: 'load-cs' });
      fetch(`/api/call-sheets/${id}`)
        .then(res => res.json())
        .then(data => {
          if (data.error) throw new Error(data.error);
          
          updateProjectInfo({
            id: data.id,
            projectTitle: data.project_title,
            projectType: data.project_type,
            directorName: data.director_name,
            producerName: data.producer_name,
            productionCompany: data.production_company,
            logoUrl: data.logo_url,
            shootDate: data.shoot_date,
            shootDayNumber: data.shoot_day_number,
            totalShootDays: data.total_shoot_days,
            callSheetNumber: data.call_sheet_number,
            revisionNumber: data.revision_number,
            generalCallTime: data.general_call_time,
            shootStartTime: data.shoot_start_time,
            estimatedWrapTime: data.estimated_wrap_time,
          });
          
          setLocations(data.locations.map((loc: any) => ({
            id: loc.id, locationName: loc.location_name, address: loc.address, locationType: loc.location_type, mapsLink: loc.maps_link, landmark: loc.landmark, parkingNotes: loc.parking_notes
          })));

          setScenes(data.scenes.map((sc: any) => ({
            id: sc.id, sceneNumber: sc.scene_number, description: sc.description, location: sc.location, intExt: sc.int_ext, dayNight: sc.day_night, startTime: sc.start_time, endTime: sc.end_time, pages: sc.pages, specialRequirements: sc.special_requirements, sceneOrder: sc.scene_order
          })));

          setActors(data.actors.map((ac: any) => ({
            id: ac.id, actorName: ac.actor_name, characterName: ac.character_name, actorType: ac.actor_type, reportingTime: ac.reporting_time, makeupCallTime: ac.makeup_call_time, onSetTime: ac.on_set_time, scenesIn: ac.scenes_in, contactNumber: ac.contact_number, notes: ac.notes
          })));

          setCrew(data.crew.map((cr: any) => ({
            id: cr.id, department: cr.department, name: cr.name, roleTitle: cr.role_title, contactNumber: cr.contact_number, reportingTime: cr.reporting_time, notes: cr.notes
          })));

          if (data.sections && Object.keys(data.sections).length > 0) {
            setAllSections({
              weather: data.sections.weather || initialSections.weather,
              equipment: data.sections.equipment || initialSections.equipment,
              meals: data.sections.meals || initialSections.meals,
              emergency: data.sections.emergency || initialSections.emergency,
              notes: data.sections.notes || initialSections.notes,
              advance: data.sections.advance || initialSections.advance
            });
          }
          
          setStep(2);
          toast.success("Call sheet loaded", { id: 'load-cs' });
        })
        .catch(err => {
          console.error(err);
          toast.error("Failed to load call sheet", { id: 'load-cs' });
        });
    }
  }, [id]);

  // Dark theme enforcer for the form, Preview component handles its own light theme
  useEffect(() => {
    document.body.style.backgroundColor = '#0A0A0F';
    document.body.style.color = '#ffffff';
    
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white overflow-hidden relative selection:bg-[#F5A623]/30">
      
      {currentStep !== 2 && (
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link href="/studio" className="hover:text-white transition-colors">Studio</Link>
            <span>›</span>
            <span className="text-white">Call Sheet Generator</span>
          </div>
          <Link 
            href="/studio/call-sheet/my-sheets"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors border border-white/10 hover:border-white/30 px-4 py-2 rounded-lg bg-[#111118]"
          >
            <FolderKanban className="w-4 h-4" />
            My Call Sheets
          </Link>
        </div>
      )}

      <div className={`${currentStep !== 2 ? 'pt-24 px-6' : ''}`}>
        {currentStep === 1 && <ProjectSetup />}
        {currentStep === 2 && <Editor />}
        {currentStep === 3 && <Preview />}
      </div>
      
    </div>
  );
}

export default function CallSheetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F] text-white flex items-center justify-center">Loading...</div>}>
      <CallSheetContent />
    </Suspense>
  );
}
