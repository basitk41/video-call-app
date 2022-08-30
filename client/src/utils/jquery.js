import $ from "jquery";
export const callAlert = () => {
  $("#calling").trigger({ type: "click" });
};
export const closeCallAlert = () => {
  $("#rejectCall").trigger({ type: "click" });
};
