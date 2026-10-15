import type { FormField } from '@super-app/relational-ui-contributor/schema-form';
import type { PersonalProfile } from './profile-values.js';
export const profileFields = [
 {key:'experience',comment:"Experience and skills you want the app to consider when helping you.",label:'Experience',dataType:'string-list'},
 {key:'learning',comment:"Topics or skills you are learning or want to develop.",label:'Learning',dataType:'string-list'},
 {key:'projects',comment:"Projects, collaborators and collaboration context relevant to your activity.",label:'Projects and collaboration',dataType:'string-list'},
 {key:'goals',comment:"Outcomes you want to achieve and priorities you want to keep in view.",label:'Goals',dataType:'string-list'},
 {key:'workingPreferences',comment:"Ways of organizing, communicating and carrying out activities that suit you.",label:'Working preferences',dataType:'string-list'},
 {key:'aiExpectations',comment:"What you expect from AI assistance, including preferred behavior and limits.",label:'AI expectations',dataType:'string-list'},
 {key:'accessibility',comment:"Access needs or accommodations you want the app to take into account.",label:'Accessibility needs',dataType:'string-list'},
] satisfies readonly (FormField & {key: keyof PersonalProfile})[];
