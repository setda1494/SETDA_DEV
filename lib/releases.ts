export type Release={id:string;projectSlug:string;project:string;artifact:string;version:string;platform:string;state:"published"|"pending";size?:string;sha256?:string;publishedAt?:string;downloadUrl?:string;changelog:string[]};
export const releases:Release[]=[
{id:"project2080-fc",projectSlug:"project2080",project:"Project2080",artifact:"Windows build",version:"Final Candidate",platform:"Windows x64",state:"pending",changelog:["Release candidate validated locally","Binary publication pending"]},
{id:"setda-dev-phase4",projectSlug:"setda-dev",project:"SETDA1494 Developer Hub",artifact:"Web deployment",version:"Phase 4",platform:"Web",state:"pending",changelog:["Project detail and account UX","Web-game-only launcher policy"]},
{id:"vbox-sync-stable",projectSlug:"vbox-share-sync",project:"VirtualBox Share Sync",artifact:"Linux utility",version:"stable",platform:"Linux",state:"pending",changelog:["CLI and GUI workflow","systemd integration"]}
];
