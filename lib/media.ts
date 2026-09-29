export type ProjectMedia={id:string;projectSlug:string;kind:"image"|"video";title:string;caption?:string;src:string;poster?:string;alt:string};
export const projectMedia:ProjectMedia[]=[];
export function mediaForProject(slug:string){return projectMedia.filter(m=>m.projectSlug===slug)}
