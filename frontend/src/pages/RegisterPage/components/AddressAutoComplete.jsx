import React, { useEffect, useRef } from "react";

const AddressAutoComplete = ({ onPlaceSelected }) => {
  const inputRef = useRef(null);

  useEffect(() => {
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.warn("Google Maps JavaScript API not loaded.");
      return;
    }

    const redDeerCenter = { lat: 52.2681, lng: -113.8112 };

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        componentRestrictions: { country: "ca" },
      }
    );

    const circle = new window.google.maps.Circle({
      center: redDeerCenter,
      radius: 22000,
    });
    autocomplete.setBounds(circle.getBounds());

    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place || !place.place_id) return;

      console.log("PLACE DEBUG:", place.place_id, place.formatted_address);

      // ⬅️ send the whole place object
      onPlaceSelected(place);
    });

    return () => {
      if (listener && listener.remove) listener.remove();
    };
  }, [onPlaceSelected]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Start typing your address (Red Deer only)"
      className="w-full p-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-sky-200 focus:border-sky-500 transition duration-200 ease-in-out shadow-inner placeholder-gray-400 text-black bg-white"
    />
  );
};

export default AddressAutoComplete;
