'use client';

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type Container, type ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim"; // Ensure this import is present

const AnimatedBackground = () => {
  const [init, setInit] = useState(false);

  useEffect(() => {
    console.log("AnimatedBackground: useEffect running"); // Added log
    initParticlesEngine(async (engine) => {
      // You can load the full tsParticles engine from "@tsparticles/engine"
      // Every plugin you need is already bundled in this file so you don't need to load it manually.
      //await loadAll(engine);
      //await loadFull(engine);
      await loadSlim(engine); // Changed from loadFull
      //await loadBasic(engine);
    }).then(() => {
      setInit(true);
      console.log("AnimatedBackground: init set to true"); // Added log
    });
  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log("Particles loaded", container); // Added log
  };

  const options: ISourceOptions = useMemo(
    () => ({
      background: {
        color: {
          value: "transparent",
        },
      },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: "repulse", // Изменено на repulse
          },
        },
        modes: {
          repulse: {
            distance: 100,
            duration: 0.4,
          },
          bubble: {
            distance: 200,
            size: 8,
            duration: 2,
            opacity: 0.8,
            color: {
              value: "#ADD8E6", // Светло-голубой цвет при наведении
            },
          },
        },
      },
      particles: {
        color: {
          value: "#ffffff",
        },
        links: {
          color: "#ffffff",
          distance: 150,
          enable: true,
          opacity: 0.2,
          width: 1,
        },
        move: {
          direction: "none",
          enable: true,
          outModes: {
            default: "out",
          },
          random: false,
          speed: 0.5, // Уменьшено до 0.5
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 80,
        },
        opacity: {
          value: 0.3,
        },
        shape: {
          type: "circle", // Возвращено на circle
        },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
    }),
    [],
  );

  if (init) {
    console.log("AnimatedBackground: Rendering Particles component"); // Added log
    return (
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
        className="absolute top-0 left-0 w-full h-full z-0"
      />
    );
  }

  return <></>;
};

export default AnimatedBackground;
