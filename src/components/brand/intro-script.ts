export const INTRO_SEEN_KEY = "planzy:intro-seen";

/** Runs before paint: skip the opening animation on reloads within the same session. */
export const INTRO_SEEN_SCRIPT = `try{if(sessionStorage.getItem("${INTRO_SEEN_KEY}")==="1")document.documentElement.classList.add("intro-seen")}catch(e){}`;
