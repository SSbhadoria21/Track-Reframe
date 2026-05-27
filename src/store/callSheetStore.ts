import { create } from 'zustand';

export interface CallSheetProjectInfo {
  id?: string;
  projectTitle: string;
  projectType: string;
  directorName: string;
  producerName: string;
  productionCompany: string;
  logoUrl?: string;
  shootDate: string;
  shootDayNumber: number;
  totalShootDays: number;
  callSheetNumber: number;
  revisionNumber: number;
  generalCallTime: string;
  shootStartTime: string;
  estimatedWrapTime: string;
  scriptUrl?: string;
}

export interface Location {
  id: string;
  locationName: string;
  address: string;
  locationType: 'Interior' | 'Exterior' | 'Both';
  mapsLink: string;
  landmark: string;
  parkingNotes: string;
}

export interface Scene {
  id: string;
  sceneNumber: string;
  description: string;
  location: string;
  intExt: 'INT' | 'EXT' | 'I/E';
  dayNight: 'DAY' | 'NIGHT' | 'EVENING' | 'MORNING';
  startTime: string;
  endTime: string;
  pages: string;
  specialRequirements: string;
  sceneOrder: number;
}

export interface Actor {
  id: string;
  actorName: string;
  characterName: string;
  actorType: 'Lead' | 'Supporting' | 'Guest' | 'Junior Artist';
  reportingTime: string;
  makeupCallTime: string;
  onSetTime: string;
  scenesIn: string[]; // references to scene.id or sceneNumber
  contactNumber: string;
  notes: string;
}

export interface CrewMember {
  id: string;
  department: string;
  name: string;
  roleTitle: string;
  contactNumber: string;
  reportingTime: string;
  notes: string;
}

// Miscellaneous JSONB section definitions
export interface WeatherSection {
  city: string;
  description: string;
  tempRange: string;
  humidity: number;
  windSpeed: string;
  sunrise: string;
  sunset: string;
  icon: string;
  specialNote: string;
}

export interface Vehicle {
  id: string;
  type: string;
  number: string;
  driverName: string;
  contact: string;
  purpose: string;
  pickupLocation: string;
  pickupTime: string;
}

export interface EquipmentSection {
  cameraBody: string;
  lensKit: string;
  stabilizer: string;
  drone: string;
  dronePermit: boolean;
  specialEquipment: string;
  vehicles: Vehicle[];
}

export interface Break {
  id: string;
  name: string;
  timeRange: string;
}

export interface MealsSection {
  breaks: Break[];
  mealLocation: string;
  dietaryNotes: string;
  cateringContact: string;
}

export interface EmergencyContact {
  id: string;
  role: string; // e.g. "Medical Emergency", "Nearest Hospital"
  name: string;
  phone: string;
  address?: string;
}

export interface NotesSection {
  bullets: string[];
  customNotes: string;
}

export interface AdvanceSchedule {
  nextShootDate: string;
  location: string;
  keyScenes: string;
  specialRequirements: string;
}

export interface CallSheetSections {
  weather: WeatherSection;
  equipment: EquipmentSection;
  meals: MealsSection;
  emergency: EmergencyContact[];
  notes: NotesSection;
  advance: AdvanceSchedule;
}

export interface CallSheetState {
  currentStep: number;
  projectInfo: CallSheetProjectInfo;
  locations: Location[];
  scenes: Scene[];
  actors: Actor[];
  crew: CrewMember[];
  sections: CallSheetSections;
  
  // Actions
  setStep: (step: number) => void;
  updateProjectInfo: (info: Partial<CallSheetProjectInfo>) => void;
  setProjectInfo: (info: CallSheetProjectInfo) => void;
  
  // Lists
  setLocations: (locations: Location[]) => void;
  addLocation: (loc: Location) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  removeLocation: (id: string) => void;
  
  setScenes: (scenes: Scene[]) => void;
  addScene: (scene: Scene) => void;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  removeScene: (id: string) => void;
  
  setActors: (actors: Actor[]) => void;
  addActor: (actor: Actor) => void;
  updateActor: (id: string, updates: Partial<Actor>) => void;
  removeActor: (id: string) => void;
  
  setCrew: (crew: CrewMember[]) => void;
  addCrew: (crew: CrewMember) => void;
  updateCrew: (id: string, updates: Partial<CrewMember>) => void;
  removeCrew: (id: string) => void;
  
  // Sections
  updateWeather: (updates: Partial<WeatherSection>) => void;
  updateEquipment: (updates: Partial<EquipmentSection>) => void;
  updateMeals: (updates: Partial<MealsSection>) => void;
  updateNotes: (updates: Partial<NotesSection>) => void;
  updateAdvance: (updates: Partial<AdvanceSchedule>) => void;
  setEmergency: (contacts: EmergencyContact[]) => void;
  
  setAllSections: (sections: CallSheetSections) => void;
  
  // AI apply
  applyAiSuggestions: (parsedData: any) => void;
}

const generateId = () => crypto.randomUUID();

export const initialProjectInfo: CallSheetProjectInfo = {
  projectTitle: '',
  projectType: 'Short Film',
  directorName: '',
  producerName: '',
  productionCompany: '',
  shootDate: new Date().toISOString().split('T')[0],
  shootDayNumber: 1,
  totalShootDays: 1,
  callSheetNumber: 1,
  revisionNumber: 1,
  generalCallTime: '06:00 AM',
  shootStartTime: '07:30 AM',
  estimatedWrapTime: '08:00 PM',
};

export const initialSections: CallSheetSections = {
  weather: {
    city: '',
    description: 'Sunny and clear',
    tempRange: '25°C - 30°C',
    humidity: 50,
    windSpeed: '10 km/h',
    sunrise: '06:30 AM',
    sunset: '06:45 PM',
    icon: 'sunny',
    specialNote: ''
  },
  equipment: {
    cameraBody: '',
    lensKit: '',
    stabilizer: '',
    drone: '',
    dronePermit: false,
    specialEquipment: '',
    vehicles: []
  },
  meals: {
    breaks: [
      { id: generateId(), name: 'Breakfast / Tea Break 1', timeRange: '08:00 AM - 08:30 AM' },
      { id: generateId(), name: 'Lunch Break', timeRange: '01:00 PM - 02:00 PM' },
      { id: generateId(), name: 'Tea Break 2', timeRange: '05:00 PM - 05:30 PM' }
    ],
    mealLocation: 'Basecamp Dining Area',
    dietaryNotes: '',
    cateringContact: ''
  },
  emergency: [
    { id: generateId(), role: 'Medical Emergency', name: 'On-Set Medic', phone: '' },
    { id: generateId(), role: 'Nearest Hospital', name: 'City Hospital', phone: '', address: '' },
    { id: generateId(), role: 'Police Station', name: 'Local Police Dept.', phone: '' },
    { id: generateId(), role: 'Fire Brigade / Ambulance', name: 'Emergency Services', phone: '101 / 108' }
  ],
  notes: {
    bullets: [
      "Please be on time and prepared.",
      "Keep your ID cards with you.",
      "Mobile phones on silent mode on set.",
      "No smoking / alcohol on set.",
      "Follow all safety protocols at all times."
    ],
    customNotes: ''
  },
  advance: {
    nextShootDate: '',
    location: '',
    keyScenes: '',
    specialRequirements: ''
  }
};

const initialCrewTemplate: CrewMember[] = [
  { id: generateId(), department: 'Direction', roleTitle: '1st AD', name: '', contactNumber: '', reportingTime: '05:30 AM', notes: '' },
  { id: generateId(), department: 'Camera', roleTitle: 'DOP', name: '', contactNumber: '', reportingTime: '06:00 AM', notes: '' },
  { id: generateId(), department: 'Art', roleTitle: 'Production Designer', name: '', contactNumber: '', reportingTime: '05:00 AM', notes: '' },
];

export const useCallSheetStore = create<CallSheetState>((set) => ({
  currentStep: 1,
  projectInfo: initialProjectInfo,
  locations: [],
  scenes: [],
  actors: [],
  crew: initialCrewTemplate,
  sections: initialSections,

  setStep: (step) => set({ currentStep: step }),
  
  updateProjectInfo: (info) => set((state) => ({
    projectInfo: { ...state.projectInfo, ...info }
  })),
  setProjectInfo: (info) => set({ projectInfo: info }),

  setLocations: (locations) => set({ locations }),
  addLocation: (loc) => set((state) => ({ locations: [...state.locations, loc] })),
  updateLocation: (id, updates) => set((state) => ({
    locations: state.locations.map(l => l.id === id ? { ...l, ...updates } : l)
  })),
  removeLocation: (id) => set((state) => ({ locations: state.locations.filter(l => l.id !== id) })),

  setScenes: (scenes) => set({ scenes }),
  addScene: (scene) => set((state) => ({ scenes: [...state.scenes, scene] })),
  updateScene: (id, updates) => set((state) => ({
    scenes: state.scenes.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  removeScene: (id) => set((state) => ({ scenes: state.scenes.filter(s => s.id !== id) })),

  setActors: (actors) => set({ actors }),
  addActor: (actor) => set((state) => ({ actors: [...state.actors, actor] })),
  updateActor: (id, updates) => set((state) => ({
    actors: state.actors.map(a => a.id === id ? { ...a, ...updates } : a)
  })),
  removeActor: (id) => set((state) => ({ actors: state.actors.filter(a => a.id !== id) })),

  setCrew: (crew) => set({ crew }),
  addCrew: (crew) => set((state) => ({ crew: [...state.crew, crew] })),
  updateCrew: (id, updates) => set((state) => ({
    crew: state.crew.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  removeCrew: (id) => set((state) => ({ crew: state.crew.filter(c => c.id !== id) })),

  updateWeather: (updates) => set((state) => ({ sections: { ...state.sections, weather: { ...state.sections.weather, ...updates } } })),
  updateEquipment: (updates) => set((state) => ({ sections: { ...state.sections, equipment: { ...state.sections.equipment, ...updates } } })),
  updateMeals: (updates) => set((state) => ({ sections: { ...state.sections, meals: { ...state.sections.meals, ...updates } } })),
  updateNotes: (updates) => set((state) => ({ sections: { ...state.sections, notes: { ...state.sections.notes, ...updates } } })),
  updateAdvance: (updates) => set((state) => ({ sections: { ...state.sections, advance: { ...state.sections.advance, ...updates } } })),
  setEmergency: (contacts) => set((state) => ({ sections: { ...state.sections, emergency: contacts } })),
  setAllSections: (sections) => set({ sections }),

  applyAiSuggestions: (parsedData) => {
    set((state) => {
      let newScenes = [...state.scenes];
      let newActors = [...state.actors];
      let newLocations = [...state.locations];

      if (parsedData.locations && Array.isArray(parsedData.locations)) {
        parsedData.locations.forEach((locName: string) => {
          if (!newLocations.find(l => l.locationName.toLowerCase() === locName.toLowerCase())) {
            newLocations.push({
              id: generateId(),
              locationName: locName,
              address: '',
              locationType: 'Both',
              mapsLink: '',
              landmark: '',
              parkingNotes: ''
            });
          }
        });
      }

      if (parsedData.scenes && Array.isArray(parsedData.scenes)) {
        parsedData.scenes.forEach((sc: any, index: number) => {
          newScenes.push({
            id: generateId(),
            sceneNumber: sc.sceneNumber || `${index + 1}`,
            description: sc.description || '',
            location: sc.location || '',
            intExt: sc.intExt || 'INT',
            dayNight: sc.dayNight || 'DAY',
            startTime: '',
            endTime: '',
            pages: sc.pages || '1/8',
            specialRequirements: '',
            sceneOrder: index
          });
        });
      }

      if (parsedData.characters && Array.isArray(parsedData.characters)) {
        parsedData.characters.forEach((char: any) => {
          newActors.push({
            id: generateId(),
            actorName: '',
            characterName: char.name || '',
            actorType: 'Lead',
            reportingTime: '06:00 AM',
            makeupCallTime: '06:15 AM',
            onSetTime: '07:30 AM',
            scenesIn: char.scenesIn || [],
            contactNumber: '',
            notes: ''
          });
        });
      }

      return {
        scenes: newScenes,
        actors: newActors,
        locations: newLocations
      };
    });
  }
}));
