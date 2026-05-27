"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Tag, User, Info, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

interface Project {
  id: string;
  title: string;
  category: string;
  date: string;
  image: string;
  status: string;
  link_type?: "external" | "internal";
  url?: string;
  content?: string;
  gallery?: { url: string; type: 'image' | 'video' }[];
  details?: string;
}

// Markdown parser helper for bold, italic, bold+italic, underline, strikethrough and newlines
function parseMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];

  const parseInline = (str: string): React.ReactNode[] => {
    const boldItalicRegex = /(\*\*\*[^*]+\*\*\*)/g;
    const boldRegex = /(\*\*[^*]+\*\*)/g;
    const underlineRegex = /(__[^_]+__)/g;
    const strikeRegex = /(~~[^~]+~~)/g;
    const italicRegex = /(\*[^*]+\*|_[^_]+_)/g;

    const matches = [
      { regex: boldItalicRegex, type: 'boldItalic' },
      { regex: boldRegex, type: 'bold' },
      { regex: underlineRegex, type: 'underline' },
      { regex: strikeRegex, type: 'strike' },
      { regex: italicRegex, type: 'italic' }
    ];

    for (const { regex, type } of matches) {
      const parts = str.split(regex);
      if (parts.length > 1) {
        return parts.flatMap((part, idx) => {
          if (part.match(regex)) {
            let innerText = "";
            let element: React.ReactNode = null;
            
            if (type === 'boldItalic') {
              innerText = part.slice(3, -3);
              element = <strong className="font-bold italic text-white">{parseInline(innerText)}</strong>;
            } else if (type === 'bold') {
              innerText = part.slice(2, -2);
              element = <strong className="font-bold text-white">{parseInline(innerText)}</strong>;
            } else if (type === 'underline') {
              innerText = part.slice(2, -2);
              element = <span className="underline">{parseInline(innerText)}</span>;
            } else if (type === 'strike') {
              innerText = part.slice(2, -2);
              element = <span className="line-through opacity-60">{parseInline(innerText)}</span>;
            } else if (type === 'italic') {
              innerText = part.slice(1, -1);
              element = <em className="italic">{parseInline(innerText)}</em>;
            }
            return <React.Fragment key={idx}>{element}</React.Fragment>;
          }
          return parseInline(part);
        });
      }
    }

    return [str];
  };

  const lines = text.split('\n');
  return lines.flatMap((line, lineIdx) => {
    const parsedLine = parseInline(line);
    if (lineIdx < lines.length - 1) {
      return [...parsedLine, <br key={`br-${lineIdx}`} />];
    }
    return parsedLine;
  });
}

function ProjectContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [project, setProject] = useState<Project | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const offset = direction === 'left' ? -600 : 600;
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      const { data } = await supabase.from('projects').select('*').eq('id', id).single();
      if (data) setProject(data);
    };
    fetchProject();
  }, [id]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <p className="font-serif text-2xl animate-pulse">Chargement...</p>
      </div>
    );
  }

  const hasExternalLink = project.link_type === "external" && project.url;

  return (
    <motion.main 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-[#0a0a0a] text-white pb-32"
    >
      <section className="relative h-[65vh] overflow-hidden">
        <Image 
          src={project.image} 
          alt={project.title} 
          fill 
          className="object-cover opacity-40 blur-[2px] scale-105" 
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a]/50 to-[#0a0a0a]" />
        
        <div className="absolute inset-0 flex flex-col justify-end px-6 md:px-16 pb-12 max-w-[1600px] mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <Link href="/" className="inline-flex items-center gap-3 text-white/50 hover:text-primary-red mb-8 transition-all uppercase tracking-[0.2em] text-[10px] font-bold group">
              <div className="p-2 bg-white/5 rounded-full group-hover:bg-primary-red/10 transition-all"><ArrowLeft size={14} /></div> Retour au portfolio
            </Link>
            <h1 className="font-serif text-6xl md:text-8xl lg:text-[140px] leading-[0.9] tracking-tighter mb-4 text-white drop-shadow-2xl">
              {parseMarkdown(project.title)}
            </h1>
            <div className="flex items-center gap-4">
              <span className="w-3 h-3 bg-primary-red rounded-full animate-pulse"></span>
              <p className="text-xl md:text-3xl text-white/60 font-light italic font-serif">
                {parseMarkdown(project.category)}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-6 md:px-16 max-w-[1600px] mx-auto w-full mt-16 grid grid-cols-1 lg:grid-cols-12 gap-16">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-8 space-y-12"
        >
          <div className="prose prose-xl prose-red">
            <div className="flex justify-start mb-8">
              <div className="inline-flex items-center gap-4 bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 px-6 py-3.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300">
                <span className="w-2.5 h-2.5 bg-primary-red rounded-full animate-pulse shadow-[0_0_10px_var(--primary-red)]"></span>
                <h2 className="font-serif text-xl md:text-2xl text-white tracking-tight leading-none italic">À propos du projet</h2>
              </div>
            </div>
            <div className="text-lg leading-relaxed text-white/80 whitespace-pre-wrap">
              {project.content ? parseMarkdown(project.content) : "Aucune description disponible."}
            </div>
            
            {project.gallery && project.gallery.length > 0 && (
              <div className="mt-16 space-y-6 relative group/carousel">
                <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
                  <div className="inline-flex items-center gap-4 bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 px-6 py-3.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300">
                    <span className="w-2.5 h-2.5 bg-primary-red rounded-full animate-pulse shadow-[0_0_10px_var(--primary-red)]"></span>
                    <h3 className="font-serif text-xl md:text-2xl text-white tracking-tight leading-none italic">Galerie Media</h3>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Défilement horizontal ou boutons de navigation</p>
                </div>
                
                <div className="relative">
                  {/* Left Navigation Button */}
                  <button 
                    onClick={() => scrollCarousel('left')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white hover:bg-primary-red hover:border-primary-red transition-all shadow-2xl opacity-0 group-hover/carousel:opacity-100 duration-300"
                    aria-label="Précédent"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Right Navigation Button */}
                  <button 
                    onClick={() => scrollCarousel('right')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-4 rounded-full bg-black/60 backdrop-blur-xl border border-white/15 text-white hover:bg-primary-red hover:border-primary-red transition-all shadow-2xl opacity-0 group-hover/carousel:opacity-100 duration-300"
                    aria-label="Suivant"
                  >
                    <ChevronRight size={20} />
                  </button>

                  <div 
                    ref={carouselRef}
                    className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scroll-smooth"
                  >
                    {project.gallery.map((item, i) => {
                      const isVideo = item.type === 'video';
                      const ytId = isVideo ? item.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/)?.[2] : null;
                      
                      return (
                        <div key={i} className="min-w-[85vw] md:min-w-[700px] aspect-video relative rounded-xl overflow-hidden shadow-2xl bg-text-black/5 snap-center border border-white/10 hover:border-primary-red/30 transition-all duration-300">
                          {isVideo ? (
                            <iframe 
                              width="100%" 
                              height="100%" 
                              src={`https://www.youtube.com/embed/${ytId}`} 
                              title={`Video ${i}`}
                              frameBorder="0" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowFullScreen
                              className="rounded-xl"
                            />
                          ) : (
                            <Image src={item.url} alt={`Detail ${i}`} fill className="object-cover rounded-xl" unoptimized />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {!project.gallery && project.image && (
              <div className="my-16 aspect-video relative rounded-sm overflow-hidden shadow-2xl">
                 <Image src={project.image} alt="detail" fill className="object-cover" unoptimized />
              </div>
            )}
          </div>
        </motion.div>

        <motion.aside 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-4 space-y-12"
        >
          <div className="bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 p-12 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300">
            <div className="flex justify-start mb-10 pb-6 border-b border-white/10">
              <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-2.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
                <span className="w-2 h-2 bg-primary-red rounded-full animate-pulse shadow-[0_0_8px_var(--primary-red)]"></span>
                <span className="font-serif italic text-white text-lg font-medium">Détails</span>
              </div>
            </div>
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-2xl text-primary-red border border-white/5 shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Date de publication</p>
                  <p className="font-medium text-lg text-white/80">{parseMarkdown(project.date || "Mai 2024")}</p>
                </div>
              </div>
              {project.category && (
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-2xl text-primary-red border border-white/5 shrink-0">
                    <Tag size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Catégorie</p>
                    <p className="font-medium text-lg text-white/80">{parseMarkdown(project.category)}</p>
                  </div>
                </div>
              )}
              {project.details && (
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-2xl text-primary-red border border-white/5 shrink-0">
                    <Info size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Infos complémentaires</p>
                    <p className="font-medium text-lg text-white/85 whitespace-pre-wrap">{parseMarkdown(project.details)}</p>
                  </div>
                </div>
              )}
            </div>
            
            {hasExternalLink && (
              <div className="mt-12">
                 <a 
                   href={project.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="block w-full text-center bg-primary-red text-white py-5 rounded-2xl hover:bg-red-600 transition-all font-bold text-xs tracking-widest uppercase shadow-2xl shadow-primary-red/30"
                 >
                    Voir le site live
                 </a>
              </div>
            )}
          </div>
        </motion.aside>
      </section>
    </motion.main>
  );
}

export default function ProjectPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-serif bg-[#0a0a0a] text-white">Chargement...</div>}>
      <ProjectContent />
    </Suspense>
  );
}
