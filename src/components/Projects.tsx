"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Project {
  id: string;
  title: string;
  category: string;
  image: string;
  status: string;
  link_type?: "external" | "internal";
  url?: string;
}

interface ProjectsProps {
  config: {
    projectsTitle: string;
    recentProjectsTitle: string;
    [key: string]: any;
  };
  label?: string;
  subLabel?: string;
  textColor?: any;
  secondaryTextColor?: any;
}

export default function Projects({ config, label, subLabel, textColor, secondaryTextColor }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'Publié')
      .order('created_at', { ascending: false });
    
    if (data) setProjects(data);
  };

  useEffect(() => {
    fetchProjects();

    const channel = supabase
      .channel('projects-realtime')
      .on('postgres_changes', { event: '*', table: 'projects', schema: 'public' }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section>
      <div className="flex justify-center md:justify-start mb-16">
        <div className="inline-flex items-center gap-4 bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 px-6 py-3.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300">
          <span className="w-2.5 h-2.5 bg-primary-red rounded-full animate-pulse shadow-[0_0_10px_var(--primary-red)]"></span>
          <motion.h2 style={{ color: textColor }} className="font-serif text-xl md:text-2xl tracking-tight leading-none italic">{label || config.recentProjectsTitle || "Projets Récents"}</motion.h2>
          <div className="w-[1px] h-5 bg-white/15" />
          <motion.span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">{subLabel || config.projectsTitle}</motion.span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {projects.map((project, index) => {
          const isInternal = project.link_type === "internal" || !project.link_type;
          const href = isInternal ? `/project?id=${project.id}` : project.url || "#";
          const Wrapper = isInternal ? Link : "a";
          const wrapperProps = isInternal ? { href } : { href, target: "_blank", rel: "noopener noreferrer" };

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: index * 0.2 }}
              className="group relative cursor-pointer"
            >
              <Wrapper {...(wrapperProps as any)}>
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 transition-all duration-700 ease-out group-hover:scale-[1.02] shadow-2xl group-hover:bg-white/20">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
                  
                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                    <div className="bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 p-4 rounded-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)]">
                      {project.category && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-1 h-1 bg-primary-red rounded-full animate-pulse"></span>
                          <p className="text-white/60 text-[10px] md:text-xs tracking-[0.2em] uppercase font-bold">
                            {project.category}
                          </p>
                        </div>
                      )}
                      <h3 className="text-white font-serif text-2xl md:text-3xl flex justify-between items-center group-hover:text-primary-red transition-colors">
                        {project.title}
                        <ArrowUpRight size={20} className="opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                      </h3>
                    </div>
                  </div>
                </div>
              </Wrapper>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
