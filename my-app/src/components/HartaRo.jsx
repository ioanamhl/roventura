// src/components/RomaniaMap.jsx
import React from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useNavigate } from "react-router-dom";
import judete from "../data/judete.json";

export default function HartaRo() {
  const navigate = useNavigate();
  const GEO_URL ="https://code.highcharts.com/mapdata/countries/ro/ro-all.geo.json";
  return (
     <div style={{
        width: "100%",
        height: 500,
        outline: "1px solid #607D8B",
        margin: "0 auto"
      }}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 5000, center: [24, 46.0] }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) => {
            console.log(" Loaded județe:", geographies.length);
            return geographies.map((geo) => {
              const name = geo.properties.name;
              const slug = name
                .toLowerCase()
                .replace(/\s+/g, "-")
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "");

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => navigate(`/forum/${slug}`)}
                  style={{
                    default: { fill: "#ECEFF1", stroke: "#607D8B" },
                    hover:   { fill: "#CFD8DC", stroke: "#37474F", cursor: "pointer" },
                    pressed: { fill: "#90A4AE" },
                  }}
                />
              );
            });
          }}
        </Geographies>
      </ComposableMap>
    </div>
  );
}
