import React from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import "./Sidebar.css";

const COUNTY_LIST = [
  { slug: "alba",       name: "Alba"       },
  { slug: "arad",       name: "Arad"       },
  { slug: "arges",      name: "Argeș"      },
  { slug: "bacau",      name: "Bacău"      },
  { slug: "bihor",      name: "Bihor"      },
  { slug: "bistrita-nasaud", name: "Bistrița-Năsăud" },
  { slug: "botosani",   name: "Botoșani"   },
  { slug: "brasov",     name: "Brașov"     },
  { slug: "braila",     name: "Brăila"     },
  { slug: "buzau",      name: "Buzău"      },
  { slug: "calarasi",   name: "Călărași"   },
  { slug: "caras-severin", name: "Caraș-Severin" },
  { slug: "cluj",       name: "Cluj"       },
  { slug: "constanta",  name: "Constanța"  },
  { slug: "covasna",    name: "Covasna"    },
  { slug: "dambovita",  name: "Dâmbovița"  },
  { slug: "dolj",       name: "Dolj"       },
  { slug: "galati",     name: "Galați"     },
  { slug: "giurgiu",    name: "Giurgiu"    },
  { slug: "gorj",       name: "Gorj"       },
  { slug: "harghita",   name: "Harghita"   },
  { slug: "hunedoara",  name: "Hunedoara"  },
  { slug: "ialomita",   name: "Ialomița"   },
  { slug: "iasi",       name: "Iași"       },
  { slug: "ilfov",      name: "Ilfov"      },
  { slug: "maramures",  name: "Maramureș"  },
  { slug: "mehedinti",  name: "Mehedinți"  },
  { slug: "mures",      name: "Mureș"      },
  { slug: "neamt",      name: "Neamț"      },
  { slug: "olt",        name: "Olt"        },
  { slug: "prahova",    name: "Prahova"    },
  { slug: "salaj",      name: "Sălaj"      },
  { slug: "satu-mare",  name: "Satu Mare"  },
  { slug: "sibiu",      name: "Sibiu"      },
  { slug: "suceava",    name: "Suceava"    },
  { slug: "teleorman",  name: "Teleorman"  },
  { slug: "timis",      name: "Timiș"      },
  { slug: "tulcea",     name: "Tulcea"     },
  { slug: "vaslui",     name: "Vaslui"     },
  { slug: "valcea",     name: "Vâlcea"     },
  { slug: "vrancea",    name: "Vrancea"    },
  { slug: "bucuresti",  name: "București"  },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { county: activeCounty } = useParams();

  return (
    <aside className="sidebar">
      <h2>Judete Romania</h2>
      <ul className="sidebar-list">
        <li className={`sidebar-item ${!activeCounty ? "active" : ""}`}>
          <button
            className="sidebar-link"
            onClick={() => navigate("/forum")}
          >
            Toate postarile
          </button>
        </li>
        {COUNTY_LIST.map(({ slug, name }) => (
          <li
            key={slug}
            className={`sidebar-item ${
              activeCounty === slug ? "active" : ""
            }`}
          >
            <Link className="sidebar-link" to={`/forum/${slug}`}>
              {name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
