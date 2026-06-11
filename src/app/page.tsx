"use client";

import { motion, useMotionValue, useSpring, useTransform, useScroll, useMotionTemplate, AnimatePresence, useMotionValueEvent } from "framer-motion";
import React, { useEffect, useState, useRef } from "react";
import { ArrowUpRight, ArrowLeft, Zap, X, Send, User, MessageSquare, CheckCircle2, Mail, Music, Volume2, VolumeX, Copy, Check, Bell, Play, Upload, Maximize2, Minimize2, Settings, LogOut, Trash2, Heart, Plus, ChevronDown, SkipBack, SkipForward, Pause, Share2 } from "lucide-react";
import Projects from "@/components/Projects";
import Socials from "@/components/Socials";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { SocialConfig } from "@/components/Socials";
import dynamic from 'next/dynamic';

const StatueBackground = dynamic(() => import('@/components/StatueBackground'), { ssr: false });

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

interface MediaItem { id: string; url: string; name: string; }
interface Message { 
  id: string; 
  name: string; 
  title: string; 
  content: string; 
  contact?: string; 
  date: string; 
  reply?: string; 
  order_id?: string; 
  attachments?: string[]; 
  agreed_to_pay?: boolean; 
  replies?: { text: string; date: string; from: string; media?: { url: string; type: 'image' | 'video' }[] }[]; 
  user_id?: string; 
  user_email?: string;
  profiles?: { avatar_url?: string; full_name?: string };
}
interface Product { id: string; name: string; price: number; description: string; images: string[]; link?: string; link_text?: string; purchase_message?: string; }

const getYoutubeId = (url: string) => { 
  if (!url) return null;
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/); 
  return (match && match[2].length === 11) ? match[2] : null; 
};

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [settings, setSettings] = useState({ 
    profession: "Artiste peintre", 
    bio: "", 
    email: "", 
    projectsTitle: "Sélection 2024", 
    recentProjectsTitle: "Projets Récents",
    galleryTitle: "Galerie", 
    bentoGridTitle: "Bento Grid",
    heroTitleMain: "PELOILLE", 
    heroTitleSub: "Lola", 
    textEffectImage: "",
    musicEnabled: false, 
    musicUrl: "", 
    musicCover: "",
    primaryColor: "#4A5D23",
    show3DBackground: true,
    musicRotationEnabled: true,
    statueTextureUrl: "",
    statueModelUrl: "",
    useOriginalMaterial: false,
    sectionsConfig: [
      { id: 'projects', label: 'Postes', subLabel: 'Sélection 2024', visible: true },
      { id: 'shop', label: 'Boutique', subLabel: 'Nos Produits', visible: true },
      { id: 'gallery', label: 'Galerie', subLabel: 'Galerie Photo/Vidéo', visible: true },
      { id: 'bento', label: 'À propos', subLabel: 'Bento Grid', visible: true }
    ]
  });
  const [socialsConfig, setSocialsConfig] = useState<SocialConfig | null>(null);
  const [galleryMedia, setGalleryMedia] = useState<MediaItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<MediaItem | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeProdImg, setActiveProdImg] = useState(0);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Notification System
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isInboxExpanded, setIsInboxExpanded] = useState(false);
  const [ownerImage, setOwnerImage] = useState("");
  const [userProfileImage, setUserProfileImage] = useState("");
  const [userPseudo, setUserPseudo] = useState("");
  const [show3DBackground, setShow3DBackground] = useState(false);
  const [replies, setReplies] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isMusicExpanded, setIsMusicExpanded] = useState(false);
  const [playerProgress, setPlayerProgress] = useState(0);
  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [songTitle, setSongTitle] = useState("");
  const [songArtist, setSongArtist] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(202);
  const lastCommentTime = useRef(0);
  const [isMutedLocal, setIsMutedLocal] = useState(false);

  const musicId = settings.musicUrl ? getYoutubeId(settings.musicUrl) : null;

  // Form State
  const [formName, setFormName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formContact, setFormContact] = useState("");
  const [formOrderId, setFormOrderId] = useState("");
  const [formAttachments, setFormAttachments] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderAgreed, setOrderAgreed] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isCompressing, setIsCompressing] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [commentImageUrl, setCommentImageUrl] = useState("");
  const [commentImgMode, setCommentImgMode] = useState<'url' | 'upload'>('upload');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyImageUrl, setReplyImageUrl] = useState("");
  const [replyImgMode, setReplyImgMode] = useState<'url' | 'upload'>('upload');
  const [replyingToName, setReplyingToName] = useState("");

  const [isMuted, setIsMuted] = useState(true);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const { scrollYProgress } = useScroll();

  // Color transition - Adjusted for portrait
  const pColor = settings.primaryColor || "#4A5D23";
  const backgroundColor = useTransform(scrollYProgress, [0, 0.15], [pColor, "#EAE8E3"]);
  const textColor = useTransform(scrollYProgress, [0, 0.15], ["#ffffff", pColor]);
  const secondaryTextColor = useTransform(scrollYProgress, [0, 0.15], ["rgba(255,255,255,0.7)", "rgba(26,26,26,0.6)"]);
  const adminBtnColor = useTransform(scrollYProgress, [0, 0.15], ["#ffffff", "#1A1A1A"]);
  const lolaColor = useTransform(scrollYProgress, [0, 0.15], ["#ffffff", pColor]);

  // Text Effect Image & Background Texture
  const hasTextImg = settings.textEffectImage && settings.textEffectImage.length > 0;
  const textBgImage = useTransform(scrollYProgress, [0, 0.15], ["none", hasTextImg ? `url(${settings.textEffectImage})` : "none"]);
  const textBgClip = useTransform(scrollYProgress, [0, 0.15], ["none", hasTextImg ? "text" : "none"]);
  const textFinalColor = useTransform(scrollYProgress, [0, 0.15], ["#ffffff", hasTextImg ? "transparent" : pColor]);
  
  // Background texture opacity transition
  const textureOpacity = useTransform(scrollYProgress, [0, 0.15], [hasTextImg ? 1 : 0, 0]);

  const springConfig = { damping: 50, stiffness: 400 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-15, 15]);
  const textShadowX = useTransform(smoothX, [-0.5, 0.5], [20, -20]);
  const textShadowY = useTransform(smoothY, [-0.5, 0.5], [20, -20]);
  const staticShadowColor = useTransform(scrollYProgress, [0, 0.15], ["rgba(0,0,0,0.55)", "rgba(0,0,0,0)"]);
  const shadowColor = useTransform(scrollYProgress, [0, 0.15], ["rgba(0,0,0,0.65)", "rgba(0,0,0,0)"]);
  const textShadow = useMotionTemplate`0 4px 15px ${staticShadowColor}, ${textShadowX}px ${textShadowY}px 30px ${shadowColor}`;
  
  const [statueColor, setStatueColor] = useState("#ffffff");
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // White at the top (on primary color background), pColor when scrolled (on gray background)
    setStatueColor(latest < 0.05 ? "#ffffff" : pColor);
  });

  // Autoplay gallery and scroll observer for active sections
  useEffect(() => {
    if (!isClient) return;

    let timer: NodeJS.Timeout;
    if (galleryMedia.length > 0) {
      const itemsPerPage = 5;
      const totalPages = Math.ceil(galleryMedia.length / itemsPerPage);
      timer = setInterval(() => {
        setGalleryIndex(prev => (prev + 1) % totalPages);
      }, 5000);
    }

    const handleScroll = () => {
      const sections = ['projects', 'shop', 'gallery', 'comments', 'bento'];
      let currentSection = "";
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            currentSection = id;
            break;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isClient, galleryMedia.length]);

  useEffect(() => {
    setIsClient(true);
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX.set(e.clientX / innerWidth - 0.5);
      mouseY.set(e.clientY / innerHeight - 0.5);
    };
    fetchData();
    checkReplies();

    const msgChannel = supabase.channel('msg-realtime').on('postgres_changes', { event: '*', table: 'messages', schema: 'public' }, () => { checkReplies(); }).subscribe();
    const settingsChannel = supabase.channel('settings-realtime').on('postgres_changes', { event: '*', table: 'settings', schema: 'public' }, () => { fetchData(); }).subscribe();
    const mediaChannel = supabase.channel('media-realtime').on('postgres_changes', { event: '*', table: 'media', schema: 'public' }, () => { fetchData(); }).subscribe();
    const commentsChannel = supabase.channel('comments-realtime').on('postgres_changes', { event: '*', table: 'comments', schema: 'public' }, () => { fetchComments(); }).subscribe();
    
    // Log silencieux de la visite globale (IP)
    const logVisit = async () => {
      const { error } = await supabase.rpc('log_site_visit');
      if (error) console.warn("Log visite:", error.message);
    };
    logVisit();

    window.addEventListener("mousemove", handleMouseMove);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id, session.user.email);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUserProfile(session.user.id, session.user.email);
    });

    return () => { 
      window.removeEventListener("mousemove", handleMouseMove); 
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(mediaChannel);
      supabase.removeChannel(commentsChannel);
      subscription.unsubscribe();
    };
  }, [mouseX, mouseY]);

  useEffect(() => {
    if (user?.email && !formContact) {
      setFormContact(user.email);
    }
  }, [user, formContact]);

  const fetchComments = async () => {
    try {
      const { data: cData, error: cErr } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
      if (!cErr && cData) {
        const userIds = Array.from(new Set(cData.map(c => c.user_id).filter(Boolean)));
        if (userIds.length > 0) {
          const { data: profData } = await supabase.from('profiles').select('id, avatar_url, full_name').in('id', userIds);
          if (profData) {
            const enriched = cData.map(c => {
              const p = profData.find(prof => prof.id === c.user_id);
              return {
                ...c,
                user_name: p?.full_name || c.user_name,
                avatar_url: p?.avatar_url || c.avatar_url
              };
            });
            setComments(enriched);
            return;
          }
        }
        setComments(cData);
      }
    } catch (e) {
      console.warn("Table public.comments non configurée ou inaccessible :", e);
    }
  };

  const fetchData = async () => {
    try {
      fetchComments();
      const { data: sData } = await supabase.from('settings').select('*');
      if (sData) {
        const global = sData.find(s => s.key === 'global')?.value;
        const soc = sData.find(s => s.key === 'socials')?.value;
        
        if (global) {
          setOwnerImage(global.profileImage || "");
          if (global.sectionsConfig) {
            const hasComments = global.sectionsConfig.some((s: any) => s.id === 'comments');
            let migrated = global.sectionsConfig.map((s: { id: string; label: string; subLabel?: string; visible: boolean }) => {
              if (s.id === 'projects' && s.subLabel === undefined) return { ...s, subLabel: global.projectsTitle || "Sélection 2024", label: global.recentProjectsTitle || "Postes" };
              if (s.id === 'gallery' && s.subLabel === undefined) return { ...s, subLabel: "Galerie Photo/Vidéo", label: global.galleryTitle || s.label };
              if (s.id === 'shop' && s.subLabel === undefined) return { ...s, subLabel: "Nos Produits" };
              if (s.id === 'comments' && s.subLabel === undefined) return { ...s, subLabel: "Vos Retours" };
              if (s.id === 'bento' && s.subLabel === undefined) return { ...s, subLabel: "Bento Grid", label: global.bentoGridTitle || s.label };
              if (s.id === 'projects' && s.label === 'Projets') return { ...s, label: 'Postes' };
              return s;
            });
            if (!hasComments) {
              migrated.push({ id: 'comments', label: 'Commentaires', subLabel: 'Vos Retours', visible: true });
            }
            global.sectionsConfig = migrated;
          } else {
            global.sectionsConfig = [
              { id: 'projects', label: 'Postes', subLabel: global.projectsTitle || 'Sélection 2024', visible: true },
              { id: 'shop', label: 'Boutique', subLabel: 'Nos Produits', visible: true },
              { id: 'gallery', label: 'Galerie', subLabel: 'Galerie Photo/Vidéo', visible: true },
              { id: 'comments', label: 'Commentaires', subLabel: 'Vos Retours', visible: true },
              { id: 'bento', label: 'À propos', subLabel: 'Bento Grid', visible: true }
            ];
          }
          setOwnerImage(global.profileImage || "");
          setShow3DBackground(global.show3DBackground ?? true);
          setSettings(prev => ({ 
            ...prev, 
            ...global,
            bio: global.profileBio ?? global.bio ?? "",
            profession: global.profileProfession ?? global.profession ?? "Artiste peintre"
          }));
        }
        
        if (soc) {
          setSocialsConfig(soc);
          setSettings(prev => ({ ...prev, email: soc.email }));
        }
      }
      const { data: mData } = await supabase.from('media').select('*');
      if (mData) {
        const global = (await supabase.from('settings').select('*').eq('key', 'global').single()).data?.value;
        if (global?.mediaOrder) {
          mData.sort((a, b) => {
            const idxA = global.mediaOrder.indexOf(a.id);
            const idxB = global.mediaOrder.indexOf(b.id);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });
        }
        setGalleryMedia(mData);
      }
      const { data: pData } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (pData) setProducts(pData);
    } catch (e) {
      console.warn("Fetch data public page bypass:", e);
    }
  };

  const fetchUserProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (error || !data) {
        const defaultName = email ? email.split('@')[0] : "Utilisateur";
        const { error: upsertError } = await supabase.from('profiles').upsert({ 
          id: userId, 
          avatar_url: "", 
          full_name: defaultName 
        });
        if (upsertError) {
          console.error("❌ Erreur lors de la création automatique du profil :", upsertError.message);
        } else {
          console.log("✅ Profil créé/mis à jour avec succès pour l'utilisateur :", defaultName);
        }
        setUserProfileImage("");
        setUserPseudo(defaultName);
      } else {
        setUserProfileImage(data.avatar_url || "");
        setUserPseudo(data.full_name || "");
      }
    } catch (err) {
      console.warn("Profil non trouvé ou table inexistante:", err);
    }
  };

  const checkReplies = async () => {
    try {
      const myMsgIdsRaw = localStorage.getItem("my_sent_messages");
      const { data: { session } } = await supabase.auth.getSession();
      
      // Essayer d'abord sans jointure pour éviter le crash 400/406
      let query = supabase.from('messages').select('*');
      
      if (session?.user) {
        query = query.or(`user_id.eq.${session.user.id},user_email.eq.${session.user.email}`);
      } else if (myMsgIdsRaw) {
        const myMsgIds = JSON.parse(myMsgIdsRaw);
        query = query.in('id', myMsgIds);
      } else {
        return;
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      
      if (data) {
        setReplies(data);
        // On récupère aussi les avatars des profils si possible
        const userIds = Array.from(new Set(data.map((m: any) => m.user_id).filter(Boolean)));
        if (userIds.length > 0) {
          const { data: pData } = await supabase.from('profiles').select('id, avatar_url, full_name').in('id', userIds);
          if (pData) {
            // On enrichit les messages avec les profils
            const enriched = data.map((m: any) => ({
              ...m,
              profiles: pData.find(p => p.id === m.user_id)
            }));
            setReplies(enriched);
          }
        }
        
        const unread = data.filter((m: Message) => m.reply && !localStorage.getItem(`read_reply_${m.id}`)).length;
        setUnreadCount(unread);
      }
    } catch (err) {
    }
  };

  const handleReplyToMessage = (msg: Message) => {
    setFormName(msg.name);
    setFormTitle(`re: ${msg.title}`);
    setFormContact(msg.contact || "");
    setFormOrderId(msg.order_id || "");
    setIsContactOpen(true);
    setIsNotifOpen(false);
  };

  const handleBuyProduct = (product: Product) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormTitle(`Achat: ${product.name}`);
    setFormOrderId(randomId);
    setFormContent(product.purchase_message || `Bonjour, je souhaite commander le produit "${product.name}" (${product.price}€).`);
    setIsContactOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
          setFormAttachments(prev => [...prev, compressedBase64]);
          setIsCompressing(false);
        } else {
          setIsCompressing(false);
        }
      };
      img.onerror = () => setIsCompressing(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setIsCompressing(false);
    reader.readAsDataURL(file);
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 400;

        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          setUserProfileImage(compressedBase64);
          await supabase.from('profiles').upsert({ 
            id: user.id, 
            avatar_url: compressedBase64, 
            full_name: user.email.split('@')[0] 
          });
          if (['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(user.email)) {
            setOwnerImage(compressedBase64);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!commentContent.trim() && !commentImageUrl) return;

    if (commentContent.length > 300) {
      alert("Le commentaire ne doit pas dépasser 300 caractères.");
      return;
    }

    if (Date.now() - lastCommentTime.current < 2000) {
      alert("Veuillez patienter 2 secondes entre chaque message.");
      return;
    }

    lastCommentTime.current = Date.now();

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentComments } = await supabase.from('comments').select('id').eq('user_id', user.id).gte('created_at', oneMinuteAgo);
    
    let isSpamming = false;
    if (recentComments && recentComments.length >= 5) {
      setIsMutedLocal(true);
      isSpamming = true;
      alert("Vous avez envoyé trop de messages en 1 minute. Vous êtes temporairement muté et vos messages doivent être vérifiés.");
    }

    const needsValidation = (settings as any).requireCommentValidation || isMutedLocal || isSpamming;

    setIsSubmittingComment(true);

    const newComment = {
      user_id: user.id,
      user_email: user.email,
      user_name: userPseudo || user.email.split('@')[0],
      avatar_url: userProfileImage || "",
      content: commentContent.substring(0, 300),
      image_url: commentImageUrl || null,
      validated: !needsValidation,
      created_at: new Date().toISOString()
    };

    try {
      const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
      if (profile) {
        newComment.user_name = profile.full_name || newComment.user_name;
        newComment.avatar_url = profile.avatar_url || newComment.avatar_url;
      }
    } catch (err) {
      console.warn("Could not load user profile details for comment:", err);
    }

    const { data, error } = await supabase.from('comments').insert(newComment).select('*');

    setIsSubmittingComment(false);

    if (error) {
      console.error("Error posting comment:", error);
      alert("Erreur lors de l'envoi du commentaire : " + error.message);
    } else {
      setCommentContent("");
      setCommentImageUrl("");
      if (data && data[0]) {
        setComments(prev => [data[0], ...prev]);
      } else {
        fetchData();
      }
    }
  };

  const handleCommentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setCommentImageUrl(compressedBase64);
          setIsCompressing(false);
        }
      };
      img.onerror = () => setIsCompressing(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setIsCompressing(false);
    reader.readAsDataURL(file);
  };

  const handleCommentDelete = async (commentId: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
    const { error } = await supabase.from('comments').update({ deleted_by_user: true }).eq('id', commentId);
    if (!error) {
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, deleted_by_user: true } : c));
    } else {
      console.error("Error soft-deleting comment:", error);
      alert("Erreur de suppression : " + error.message);
    }
  };

  const handleCommentLike = async (comment: any) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const currentLikes = comment.likes || [];
    const alreadyLiked = currentLikes.includes(user.id);
    let newLikes: string[];
    if (alreadyLiked) {
      newLikes = currentLikes.filter((id: string) => id !== user.id);
    } else {
      newLikes = [...currentLikes, user.id];
    }
    
    // Optimistic update
    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, likes: newLikes } : c));
    
    const { error } = await supabase.from('comments').update({ likes: newLikes }).eq('id', comment.id);
    if (error) {
      console.error("Error updating likes:", error);
      fetchComments();
    }
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!replyContent.trim() && !replyImageUrl) return;

    if (replyContent.length > 300) {
      alert("La réponse ne doit pas dépasser 300 caractères.");
      return;
    }

    if (Date.now() - lastCommentTime.current < 2000) {
      alert("Veuillez patienter 2 secondes entre chaque message.");
      return;
    }

    lastCommentTime.current = Date.now();

    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { data: recentComments } = await supabase.from('comments').select('id').eq('user_id', user.id).gte('created_at', oneMinuteAgo);
    
    let isSpamming = false;
    if (recentComments && recentComments.length >= 5) {
      setIsMutedLocal(true);
      isSpamming = true;
      alert("Vous avez envoyé trop de messages en 1 minute. Vous êtes temporairement muté et vos messages doivent être vérifiés.");
    }

    const needsValidation = (settings as any).requireCommentValidation || isMutedLocal || isSpamming;

    setIsSubmittingComment(true);

    const newReply = {
      parent_id: parentId,
      user_id: user.id,
      user_email: user.email,
      user_name: userPseudo || user.email.split('@')[0],
      avatar_url: userProfileImage || "",
      content: replyContent.substring(0, 300),
      image_url: replyImageUrl || null,
      likes: [],
      validated: !needsValidation,
      created_at: new Date().toISOString()
    };

    try {
      const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single();
      if (profile) {
        newReply.user_name = profile.full_name || newReply.user_name;
        newReply.avatar_url = profile.avatar_url || newReply.avatar_url;
      }
    } catch (err) {
      console.warn("Could not load user profile details for reply:", err);
    }

    const { data, error } = await supabase.from('comments').insert(newReply).select('*');
    setIsSubmittingComment(false);

    if (error) {
      console.error("Error posting reply:", error);
      alert("Erreur lors de l'envoi de la réponse : " + error.message);
    } else {
      setReplyContent("");
      setReplyImageUrl("");
      setReplyingToId(null);
      if (data && data[0]) {
        setComments(prev => [...prev, data[0]]);
      } else {
        fetchComments();
      }
    }
  };

  const handleReplyImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          setReplyImageUrl(compressedBase64);
          setIsCompressing(false);
        }
      };
      img.onerror = () => setIsCompressing(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setIsCompressing(false);
    reader.readAsDataURL(file);
  };

  const copyEmail = () => { navigator.clipboard.writeText(settings.email || "lolapeloille@gmail.com"); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const getYoutubeThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Load YouTube Player API and synchronize states
  useEffect(() => {
    if (!isClient || !musicId) return;

    // Load YouTube API script
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    let player: any;
    const initPlayer = () => {
      if (!(window as any).YT || !(window as any).YT.Player) return;
      
      player = new (window as any).YT.Player('youtube-player', {
        videoId: musicId,
        playerVars: {
          autoplay: 1,
          mute: isMuted ? 1 : 0,
          loop: 1,
          playlist: musicId,
          controls: 0,
          showinfo: 0,
          rel: 0
        },
        events: {
          onReady: (event: any) => {
            setYtPlayer(event.target);
            try {
              const videoData = event.target.getVideoData();
              if (videoData) {
                setSongTitle(videoData.title || "");
                setSongArtist(videoData.author || "");
              }
              setDuration(event.target.getDuration() || 202);
            } catch (err) {}
          },
          onStateChange: (event: any) => {
            try {
              if (event.data === (window as any).YT.PlayerState.PLAYING) {
                const videoData = event.target.getVideoData();
                if (videoData) {
                  setSongTitle(videoData.title || "");
                  setSongArtist(videoData.author || "");
                }
                setDuration(event.target.getDuration() || 202);
              }
            } catch (err) {}
          }
        }
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      const checkYT = setInterval(() => {
        if ((window as any).YT && (window as any).YT.Player) {
          initPlayer();
          clearInterval(checkYT);
        }
      }, 500);
      return () => clearInterval(checkYT);
    }

    return () => {
      if (player) {
        try { player.destroy(); } catch (err) {}
      }
    };
  }, [isClient, musicId]);

  // Synchronize Mute status and play state on YT Player
  useEffect(() => {
    if (!ytPlayer) return;
    try {
      if (isMuted) {
        ytPlayer.mute();
      } else {
        ytPlayer.unMute();
        ytPlayer.playVideo();
      }
    } catch (err) {}
  }, [isMuted, ytPlayer]);

  // Real-time video time and progress scraper
  useEffect(() => {
    if (!ytPlayer) return;
    const interval = setInterval(() => {
      try {
        const state = ytPlayer.getPlayerState();
        if (state === 1) { // PLAYING
          const cur = ytPlayer.getCurrentTime() || 0;
          const dur = ytPlayer.getDuration() || 202;
          setCurrentTime(cur);
          setDuration(dur);
          setPlayerProgress((cur / dur) * 100);
        }
      } catch (err) {}
    }, 500);
    return () => clearInterval(interval);
  }, [ytPlayer]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const newMessage = { 
      name: formName, 
      title: formTitle, 
      content: formContent, 
      contact: formContact, 
      order_id: formOrderId || null,
      attachments: formAttachments,
      agreed_to_pay: orderAgreed,
      date: new Date().toLocaleString("fr-FR"),
      user_id: user?.id || null,
      user_email: user?.email || null
    };
    
    try {
      const { data, error } = await supabase.from('messages').insert(newMessage).select();
      if (error) throw error;
      
      if (data) {
        if (!user) {
          const existing = localStorage.getItem("my_sent_messages");
          const ids = existing ? JSON.parse(existing) : [];
          localStorage.setItem("my_sent_messages", JSON.stringify([...ids, data[0].id]));
        }
        setIsSubmitting(false); 
        setShowSuccess(true);
        setOrderAgreed(false);
        setTimeout(() => { 
          setShowSuccess(false); 
          setIsContactOpen(false); 
          setFormName(""); 
          setFormTitle(""); 
          setFormContent(""); 
          setFormContact(""); 
          setFormOrderId(""); 
          setFormAttachments([]); 
        }, 2000);
      }
    } catch (error: any) {
      console.error("Erreur d'envoi:", error);
      alert("Erreur lors de l'envoi du message : " + (error.message || "Erreur inconnue"));
      setIsSubmitting(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setIsAuthModalOpen(false);
        setAuthEmail("");
        setAuthPassword("");
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_auth');
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
  };


  if (!isClient) return null;

  const navSections = (settings.sectionsConfig || []).filter(s => {
    if (s.id === 'shop' && products.length === 0) return false;
    if (s.id === 'gallery' && galleryMedia.length === 0) return false;
    return s.visible;
  });

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.main 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen relative flex flex-col pt-24 pb-24 md:pt-32 md:pb-32 px-6 md:px-16 w-full overflow-x-hidden bg-transparent"
    >
      {/* Center Category Floating Navigation Bar */}
      {navSections.length > 0 && (
        <header className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[250] flex items-center justify-center bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 px-5 py-2.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300">
          <nav className="flex items-center gap-1 md:gap-2">
            {navSections.map((sec) => {
              const isActive = activeSection === sec.id;
              let displayLabel = sec.label;
              if (sec.id === 'projects' && displayLabel === 'Postes') displayLabel = 'Projets';
              return (
                <button
                  key={sec.id}
                  onClick={() => scrollToSection(sec.id)}
                  type="button"
                  className={`px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                    isActive 
                      ? "bg-primary-red text-white shadow-lg shadow-primary-red/30 scale-105" 
                      : "text-white/85 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </nav>
        </header>
      )}
      {/* Background Texture Overlay */}
      {hasTextImg && (
        <motion.div 
          style={{ 
            backgroundImage: `url(${settings.textEffectImage})`,
            opacity: textureOpacity 
          }}
          className="fixed inset-0 z-0 pointer-events-none bg-cover bg-center"
        />
      )}

      {/* Global Background Color Layer */}
      <motion.div 
        className="fixed inset-0 z-[-10]" 
        style={{ backgroundColor }}
      />

      {show3DBackground && (
        <div className="fixed inset-0 z-[-5]">
          <StatueBackground color={statueColor} textureUrl={settings.statueTextureUrl} modelUrl={settings.statueModelUrl} useOriginalMaterial={settings.useOriginalMaterial} />
        </div>
      )}
      {/* Dynamic Theme Styles */}
      <style jsx global>{`
        :root {
          --primary-red: ${pColor};
          --color-primary-red: ${pColor};
          --shadow-primary-green: ${pColor}22;
          --color-shadow-primary-green: ${pColor}22;
        }
      `}</style>

      <AnimatePresence>
        {selectedImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedImage(null)} className="fixed inset-0 z-[200] bg-soft-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 cursor-zoom-out">
            <button className="absolute top-8 right-8 text-white/50 hover:text-white"><X size={32} /></button>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full h-full flex items-center justify-center"> 
              {getYoutubeId(selectedImage.url) ? (
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${getYoutubeId(selectedImage.url)}?autoplay=1`} 
                  title={selectedImage.name}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                  className="max-w-5xl aspect-video shadow-2xl"
                />
              ) : (
                <Image src={selectedImage.url} alt={selectedImage.name} fill className="object-contain" unoptimized /> 
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-8 right-8 md:bottom-12 md:right-16 z-[300] flex flex-col items-end gap-4">
        <motion.button 
          onClick={() => setIsNotifOpen(!isNotifOpen)} 
          style={{ color: textColor, borderColor: textColor }}
          whileHover={{ scale: 1.05 }} 
          whileTap={{ scale: 0.95 }} 
          className="bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center relative transition-all duration-300 hover:bg-[#0c0c0c]/95"
        >
          <Bell size={24} />
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-primary-red text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white/10">{unreadCount}</span>}
        </motion.button>
        
        <div className="flex gap-4">
          {['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(user?.email) && (
            <Link href="/admin">
              <motion.div
                style={{ color: textColor, borderColor: textColor }}
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }} 
                className="bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center relative transition-all duration-300 hover:bg-[#0c0c0c]/95"
              >
                <Settings size={24} />
              </motion.div>
            </Link>
          )}
          
          <motion.button 
            onClick={() => user ? setIsAccountOpen(!isAccountOpen) : setIsAuthModalOpen(true)} 
            style={{ color: textColor, borderColor: textColor }}
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            className="bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 text-white w-12 h-12 md:w-14 md:h-14 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_10px_30px_rgba(0,0,0,0.5)] flex items-center justify-center relative transition-all duration-300 hover:bg-[#0c0c0c]/95 overflow-hidden"
          >
            {user ? (
              userProfileImage ? (
                <Image src={userProfileImage} alt="Profile" fill className="object-cover" unoptimized />
              ) : (
                <User size={24} />
              )
            ) : (
              <User size={24} />
            )}
            {user && <span className="absolute -top-1 -right-1 bg-green-500 w-3 h-3 rounded-full border-2 border-[#0a0a0a] z-10"></span>}
          </motion.button>
        </div>

        <motion.button onClick={() => setIsContactOpen(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-primary-red text-white w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl flex items-center justify-center group overflow-hidden">
          <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 2 }}><Zap size={24} fill="currentColor" /></motion.div>
        </motion.button>
      </div>

      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAuthModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-10 text-white">
              <form onSubmit={handleAuth} className="space-y-8">
                <div className="space-y-2 text-center">
                  <h3 className="font-serif text-4xl italic text-primary-red">{isSignUp ? "Créer un compte" : "Connexion"}</h3>
                  <p className="text-xs text-white/40 uppercase tracking-widest">{isSignUp ? "Rejoignez l'aventure" : "Bon retour parmi nous"}</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Email</label>
                    <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-red transition-all" placeholder="votre@email.com" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/30 ml-1">Mot de passe</label>
                    <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-red transition-all" placeholder="••••••••" required />
                  </div>
                </div>

                {authError && <p className="text-primary-green text-[10px] font-bold uppercase text-center tracking-widest">{authError}</p>}

                <button type="submit" disabled={isAuthLoading} className="w-full bg-primary-red text-white py-5 rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-primary-green transition-all shadow-2xl shadow-primary-red/30 flex items-center justify-center gap-3">
                  {isAuthLoading ? "Chargement..." : (isSignUp ? "S'INSCRIRE" : "SE CONNECTER")}
                </button>

                <p className="text-center text-[10px] text-white/40 uppercase tracking-widest">
                  {isSignUp ? "Déjà un compte ?" : "Pas encore de compte ?"} 
                  <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="ml-2 text-primary-red hover:underline font-bold">
                    {isSignUp ? "SE CONNECTER" : "S'INSCRIRE"}
                  </button>
                </p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedProduct && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProduct(null)} className="absolute inset-0 bg-soft-black/80 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-6xl bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
              
              <div className="w-full h-80 md:h-auto md:w-3/5 relative bg-white/5 group shrink-0 overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeProdImg}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0"
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x > 50) setActiveProdImg(prev => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length);
                      else if (info.offset.x < -50) setActiveProdImg(prev => (prev + 1) % selectedProduct.images.length);
                    }}
                  >
                    <Image src={selectedProduct.images[activeProdImg] || ""} alt={selectedProduct.name} fill className="object-contain p-8 md:p-12 drop-shadow-2xl" unoptimized />
                  </motion.div>
                </AnimatePresence>
                
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 left-6 z-20 p-3 bg-black/40 hover:bg-black/60 rounded-full text-white backdrop-blur-md transition-all shadow-xl"><X size={24} /></button>
                
                {selectedProduct.images.length > 1 && (
                  <>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveProdImg(prev => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length); }}
                      className="absolute left-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-primary-red rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveProdImg(prev => (prev + 1) % selectedProduct.images.length); }}
                      className="absolute right-6 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/40 hover:bg-primary-red rounded-full text-white backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 hidden md:flex"
                    >
                      <ArrowLeft size={20} className="rotate-180" />
                    </button>
                    
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20">
                      <div className="px-4 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold tracking-widest text-white/80">
                        {activeProdImg + 1} / {selectedProduct.images.length}
                      </div>
                      <div className="flex gap-2">
                        {selectedProduct.images.map((_, i) => (
                          <button key={i} onClick={() => setActiveProdImg(i)} className={`w-2 h-2 rounded-full transition-all ${activeProdImg === i ? 'bg-primary-red w-4' : 'bg-white/20 hover:bg-white/40'}`} />
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Product Info */}
              <div className="w-full md:w-2/5 p-8 md:p-16 flex flex-col justify-center bg-black/40 backdrop-blur-3xl overflow-y-auto">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 bg-primary-red rounded-full animate-pulse"></span>
                      <p className="text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-white/60">Produit Premium</p>
                    </div>
                    <h2 className="font-serif text-4xl md:text-6xl text-white leading-tight">{selectedProduct.name}</h2>
                    <p className="text-4xl font-serif italic text-primary-red">{selectedProduct.price}€</p>
                  </div>

                  <div className="h-[1px] w-20 bg-primary-red/30"></div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Description du produit</h4>
                    <p className="text-sm md:text-base leading-relaxed text-white/70 whitespace-pre-line">{selectedProduct.description}</p>
                    
                    {selectedProduct.link && (
                      <div className="pt-4">
                        <Link 
                          href={selectedProduct.link} 
                          target="_blank"
                          className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary-red border-b border-primary-red/30 pb-1 hover:border-primary-red transition-all"
                        >
                          {selectedProduct.link_text || "En savoir plus"} <ArrowUpRight size={12} />
                        </Link>
                      </div>
                    )}
                  </div>

                   <div className="pt-8 space-y-6">
                    <button 
                      onClick={() => { handleBuyProduct(selectedProduct); if (user) setSelectedProduct(null); }} 
                      className="w-full bg-primary-red text-white py-6 rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-primary-red/80 transition-all shadow-2xl shadow-primary-red/30 flex items-center justify-center gap-4 group"
                    >
                      {user ? "COMMANDER MAINTENANT" : "SE CONNECTER POUR COMMANDER"} <Zap size={18} fill="currentColor" className="group-hover:scale-125 transition-transform" />
                    </button>
                    <p className="text-[9px] text-center text-white/30 uppercase tracking-widest">Paiement en cash sur place</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNotifOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              width: isInboxExpanded ? '90vw' : undefined,
              height: isInboxExpanded ? '85vh' : undefined,
              maxWidth: isInboxExpanded ? '1200px' : undefined,
              bottom: isInboxExpanded ? '5vh' : undefined,
              right: isInboxExpanded ? '5vw' : undefined,
              left: isInboxExpanded ? '5vw' : undefined,
              margin: isInboxExpanded ? 'auto' : undefined
            }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }} 
            className={`fixed z-[200] bg-[#0c0c0c]/85 backdrop-blur-2xl rounded-3xl border border-white/15 overflow-hidden flex flex-col shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_50px_rgba(0,0,0,0.8)] ${isInboxExpanded ? '' : 'bottom-32 right-8 md:bottom-44 md:right-16 w-72 md:w-96'}`}
          >
            <div className="bg-white/5 backdrop-blur-md p-6 flex justify-between items-center shrink-0 border-b border-white/10"> 
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-primary-red rounded-full animate-pulse"></span>
                <h4 className="text-white font-serif italic text-lg">Réponses</h4> 
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsInboxExpanded(!isInboxExpanded)} className="text-white/50 hover:text-white transition-colors">
                  {isInboxExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button onClick={() => setIsNotifOpen(false)}><X size={16} className="text-white/50" /></button> 
              </div>
            </div>
            <div className={`p-4 overflow-y-auto space-y-4 flex-1 ${isInboxExpanded ? '' : 'max-h-[400px]'}`}>
              {replies.length === 0 ? <p className="text-xs text-white/40 text-center py-8">Aucune réponse pour le moment.</p> : (
                replies.map((r: Message) => (
                  <div key={r.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative group hover:bg-white/10 transition-all cursor-pointer" onClick={() => { if(r.reply) localStorage.setItem(`read_reply_${r.id}`, "true"); checkReplies(); }}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 overflow-hidden relative shrink-0">
                          {r.profiles?.avatar_url ? <Image src={r.profiles.avatar_url} alt="Profile" fill className="object-cover" unoptimized /> : <User size={14} className="m-auto mt-2 text-white/20" />}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{r.profiles?.full_name || r.title || "Utilisateur"}</p>
                          {r.order_id && <span className="text-[9px] font-bold text-primary-red">Code: {r.order_id}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 mb-4">
                      {r.replies && r.replies.length > 0 ? (
                        r.replies.map((rep: { text: string; date: string; from: string; media?: { url: string; type: string }[] }, idx: number) => (
                          <div key={idx} className={`${rep.from === 'Lola' ? 'bg-white/5 border-l-2 border-primary-red pl-4 py-2 rounded-r-lg' : ''} space-y-3`}>
                            <div>
                              <p className="text-[9px] font-bold uppercase text-white/30 mb-1">{rep.from} • {rep.date}</p>
                              <p className="text-sm font-medium text-white/90">{rep.text}</p>
                            </div>
                            {rep.media && rep.media.length > 0 && (
                              <div className="flex flex-wrap gap-2 pt-1">
                                {rep.media.map((m, midx) => (
                                  <div key={midx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10 group cursor-pointer shadow-lg" onClick={(e) => { e.stopPropagation(); setSelectedImage({ url: m.url, name: "Image jointe" } as any); }}>
                                    <Image src={m.url} alt="Media" fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Maximize2 size={16} className="text-white" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm font-medium text-white/90">{r.reply || <span className="text-white/20 italic">En attente de réponse...</span>}</p>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[9px] opacity-30 italic">{r.reply ? "Répondu par Lola" : "Envoyé par vous"}</p>
                      {r.reply && (
                        <button 
                          onClick={() => handleReplyToMessage(r)}
                          className="text-[10px] font-bold text-primary-red uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                          <Send size={10} /> Répondre
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAccountOpen && user && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.9 }} 
            className="fixed bottom-32 right-8 md:bottom-44 md:right-16 z-[300] bg-[#0c0c0c]/85 backdrop-blur-2xl rounded-3xl border border-white/15 w-72 md:w-80 overflow-hidden flex flex-col shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_50px_rgba(0,0,0,0.8)]"
          >
            <div className="bg-white/5 backdrop-blur-md p-6 border-b border-white/10 flex justify-between items-center">
              <h4 className="text-white font-serif italic text-lg">Mon Compte</h4>
              <button onClick={() => setIsAccountOpen(false)}><X size={16} className="text-white/50" /></button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 overflow-hidden relative flex items-center justify-center">
                  {userProfileImage ? <Image src={userProfileImage} alt="Profile" fill className="object-cover" unoptimized /> : <User size={20} className="text-white/40" />}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-primary-red truncate">Connecté en tant que</p>
                  <p className="text-xs text-white/60 truncate">{user.email}</p>
                </div>
              </div>

              {user && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Pseudo (Nom d'affichage)</p>
                    <input 
                      type="text" 
                      placeholder="Votre pseudo..." 
                      value={userPseudo}
                      onChange={async (e) => {
                        const newPseudo = e.target.value;
                        setUserPseudo(newPseudo);
                        await supabase.from('profiles').upsert({ 
                          id: user.id, 
                          avatar_url: userProfileImage, 
                          full_name: newPseudo 
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] outline-none focus:border-primary-red transition-all text-white font-medium"
                    />
                  </div>

                  <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Photo de profil</p>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="URL de l'image..." 
                      value={userProfileImage}
                      onChange={async (e) => {
                        const newUrl = e.target.value;
                        setUserProfileImage(newUrl);
                        await supabase.from('profiles').upsert({ id: user.id, avatar_url: newUrl, full_name: userPseudo });
                        if (['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(user.email)) {
                          setOwnerImage(newUrl);
                        }
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] outline-none focus:border-primary-red transition-all text-white"
                    />
                    
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">Ou local</span>
                      <label className="cursor-pointer text-[10px] font-bold text-primary-red uppercase tracking-widest flex items-center gap-1.5 hover:text-primary-green-400 transition-colors">
                        <Upload size={12} /> Importer un fichier
                        <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                      </label>
                    </div>
                  </div>

                  {/* Owner site settings (Bio & Profession) */}
                  {['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(user.email) && (
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-red">Paramètres du Site (Lola)</p>
                      
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Profession / Rôle</p>
                        <input 
                          type="text" 
                          value={settings.profession || ""}
                          onChange={async (e) => {
                            const newProf = e.target.value;
                            setSettings(prev => ({ ...prev, profession: newProf }));
                            
                            // Save globally
                            const { data: currentSettings } = await supabase.from('settings').select('*').eq('key', 'global').single();
                            const globalVal = currentSettings?.value || {};
                            globalVal.profileProfession = newProf;
                            await supabase.from('settings').upsert({ key: 'global', value: globalVal });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] outline-none focus:border-primary-red transition-all text-white font-medium"
                        />
                      </div>

                      <div className="space-y-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-white/30">Biographie (Bio)</p>
                        <textarea 
                          rows={3}
                          value={settings.bio || ""}
                          onChange={async (e) => {
                            const newBio = e.target.value;
                            setSettings(prev => ({ ...prev, bio: newBio }));
                            
                            // Save globally
                            const { data: currentSettings } = await supabase.from('settings').select('*').eq('key', 'global').single();
                            const globalVal = currentSettings?.value || {};
                            globalVal.profileBio = newBio;
                            await supabase.from('settings').upsert({ key: 'global', value: globalVal });
                          }}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[10px] outline-none focus:border-primary-red transition-all text-white font-medium resize-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={handleLogout}
                className="w-full bg-white/5 border border-white/10 text-white/60 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary-red hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Se déconnecter
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isContactOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsContactOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="relative w-full max-w-lg bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8 md:p-12 overflow-hidden text-white">
              {showSuccess ? (
                <div className="py-12 text-center space-y-6">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 size={40} /></motion.div>
                  <div className="space-y-2">
                    <h3 className="font-serif text-3xl italic">Message envoyé !</h3>
                    <p className="text-xs opacity-50">Lola vous répondra bientôt.</p>
                  </div>
                  {formOrderId && (
                    <div className="bg-primary-red/5 p-6 rounded-sm border border-primary-red/20 space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary-red">Votre code de commande</p>
                      <p className="text-4xl font-serif text-white">{formOrderId}</p>
                      <p className="text-[9px] opacity-40 italic">Notez ce code pour le donner lors du paiement en cash.</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <h3 className="font-serif text-4xl italic text-[var(--primary-red)]">Me contacter</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Nom & Prénom" className="w-full bg-white/5 border-b border-white/20 py-3 outline-none focus:border-primary-red transition-all" required />
                    <input type="text" value={formContact} onChange={(e) => setFormContact(e.target.value)} placeholder="Email / Tél" className="w-full bg-white/5 border-b border-white/20 py-3 outline-none focus:border-primary-red transition-all" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Objet" className="w-full bg-white/5 border-b border-white/20 py-3 outline-none focus:border-primary-red transition-all" required />
                    <input type="text" value={formOrderId} onChange={(e) => setFormOrderId(e.target.value)} placeholder="ID Commande (Optionnel)" className="w-full bg-white/5 border-b border-white/20 py-3 outline-none focus:border-primary-red transition-all" readOnly={formTitle.startsWith("Achat:")} />
                  </div>
                  <textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Message..." rows={4} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-primary-red resize-none transition-all" required />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Pièces jointes</label>
                      <label className="cursor-pointer text-[10px] font-bold text-primary-red uppercase tracking-widest flex items-center gap-2">
                        <Upload size={14} /> Joindre une image
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      </label>
                    </div>
                    {formAttachments.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {formAttachments.map((img, i) => (
                          <div key={i} className="relative w-12 h-12 rounded-xs overflow-hidden border border-text-black/10 flex-shrink-0 group">
                            <Image src={img} alt="attachment" fill className="object-cover" unoptimized />
                            <button type="button" onClick={() => setFormAttachments(formAttachments.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-primary-green/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"><X size={12} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {(formOrderId || formTitle.startsWith("Achat:")) && (
                    <div className="flex items-start gap-3 bg-primary-red/5 p-4 rounded-sm border border-primary-red/10">
                      <input 
                        type="checkbox" 
                        id="orderAgree" 
                        checked={orderAgreed} 
                        onChange={(e) => setOrderAgreed(e.target.checked)} 
                        className="mt-1 accent-primary-red w-4 h-4 rounded-xs border-text-black/20" 
                        required 
                      />
                      <label htmlFor="orderAgree" className="text-[11px] leading-relaxed opacity-70 cursor-pointer">
                        Je m'engage à régler le montant de ce produit ({selectedProduct ? `${selectedProduct.price}€` : "indiqué"}) une fois la commande validée par Lola. <span className="text-primary-red font-bold">*</span>
                      </label>
                    </div>
                  )}

                  <button type="submit" disabled={isSubmitting || isCompressing} className={`w-full bg-text-black text-white py-4 rounded-sm font-bold text-xs tracking-widest uppercase flex items-center justify-center gap-3 ${(isSubmitting || isCompressing) ? 'opacity-50 cursor-not-allowed' : ''}`}> 
                    {(isSubmitting || isCompressing) ? (isCompressing ? "COMPRESSION..." : "ENVOI...") : <>ENVOYER <Send size={14} /></>} 
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      <section className="flex-1 flex flex-col justify-center min-h-[85vh] relative z-10 mt-24 md:mt-0 max-w-[1600px] mx-auto w-full">
        <div className="relative" style={{ perspective: 1000 }}>
          {settings.musicEnabled && musicId && (
            <motion.div 
              style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} 
              className="absolute -top-28 right-0 md:-top-16 md:-right-12 z-30 origin-center scale-90 md:scale-100"
            >
              {/* Desktop Full Card Player */}
              <div className="hidden md:flex bg-[#0c0c0c]/90 backdrop-blur-2xl border border-white/15 p-5 rounded-[32px] w-72 flex-col shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center pb-3 border-b border-white/5">
                  <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-white/50 font-sans truncate max-w-[180px]">
                    {settings.musicCover ? "MUSIQUE EN COURS" : "BENTO PLAYER"}
                  </span>
                  <div className="w-6 h-6 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
                  </div>
                </div>

                {/* Cover Art */}
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 mt-4 bg-black/40">
                  {settings.musicCover ? (
                    <Image 
                      src={settings.musicCover} 
                      alt="Cover Art" 
                      fill 
                      className={`object-cover ${!isMuted && settings.musicRotationEnabled ? "animate-spin-slow" : ""}`} 
                      unoptimized 
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-[#111] to-[#333] flex items-center justify-center">
                      <Music size={48} className="text-white/20" />
                    </div>
                  )}
                </div>

                {/* Song Info */}
                <div className="flex justify-between items-center mt-5">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate font-sans" title={songTitle || settings.heroTitleMain || "BENTO TRACK"}>
                      {songTitle || settings.heroTitleMain || "BENTO TRACK"}
                    </h4>
                    <p className="text-xs text-white/50 truncate font-sans" title={songArtist || settings.heroTitleSub || "Lola Peloille"}>
                      {songArtist || settings.heroTitleSub || "Lola Peloille"}
                    </p>
                  </div>
                </div>

                {/* Scrubber / Progress Bar */}
                <div className="space-y-1.5 mt-5">
                  <div 
                    className="relative w-full h-1 bg-white/10 rounded-full overflow-hidden cursor-pointer" 
                    onClick={(e) => {
                      if (!ytPlayer) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percentage = clickX / rect.width;
                      const targetTime = percentage * duration;
                      try {
                        ytPlayer.seekTo(targetTime, true);
                        setCurrentTime(targetTime);
                        setPlayerProgress(percentage * 100);
                      } catch(err) {}
                    }}
                  >
                    <div 
                      className="absolute left-0 top-0 h-full bg-primary-red rounded-full shadow-[0_0_8px_var(--primary-red)]" 
                      style={{ width: `${playerProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-white/40 uppercase tracking-widest font-sans">
                    <span>{formatTime(Math.round(currentTime))}</span>
                    <span>{formatTime(Math.round(duration))}</span>
                  </div>
                </div>

                {/* Controls (SkipBack, Play/Pause/Mute, SkipForward) */}
                <div className="flex justify-center items-center gap-6 mt-4 pb-2">
                  <button 
                    className="text-white/60 hover:text-white transition-colors" 
                    onClick={() => {
                      if (!ytPlayer) return;
                      try {
                        const target = Math.max(0, currentTime - 10);
                        ytPlayer.seekTo(target, true);
                        setCurrentTime(target);
                      } catch (err) {}
                    }}
                  >
                    <SkipBack size={18} fill="currentColor" />
                  </button>
                  
                  <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className="w-12 h-12 bg-white text-black hover:bg-white/90 rounded-full flex items-center justify-center transition-all shadow-lg hover:scale-105 active:scale-95"
                  >
                    {isMuted ? (
                      <Play size={18} fill="currentColor" className="ml-0.5 text-black" />
                    ) : (
                      <Pause size={18} fill="currentColor" className="text-black" />
                    )}
                  </button>

                  <button 
                    className="text-white/60 hover:text-white transition-colors" 
                    onClick={() => {
                      if (!ytPlayer) return;
                      try {
                        const target = Math.min(duration, currentTime + 10);
                        ytPlayer.seekTo(target, true);
                        setCurrentTime(target);
                      } catch (err) {}
                    }}
                  >
                    <SkipForward size={18} fill="currentColor" />
                  </button>
                </div>
              </div>

              {/* Mobile Compact Capsule Player */}
              <div 
                onClick={() => setIsMuted(!isMuted)}
                className="flex md:hidden pointer-events-auto cursor-pointer bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 p-2 rounded-full items-center gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] hover:bg-[#0c0c0c]/95 transition-all duration-300 relative overflow-hidden h-12 w-64 select-none pr-4"
              >
                {/* Cover art spinning */}
                <div className={`relative w-8 h-8 rounded-full overflow-hidden shadow-lg shrink-0 border border-white/10 ${!isMuted && settings.musicRotationEnabled ? "animate-spin-slow" : ""}`}>
                  {settings.musicCover ? (
                    <Image src={settings.musicCover} alt="Cover" fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-[#222] flex items-center justify-center">
                      <Music size={14} className="text-white/40" />
                    </div>
                  )}
                </div>

                {/* Song info and play status */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <span className="text-[7px] font-bold uppercase tracking-[0.2em] text-primary-red leading-none mb-0.5">Musique</span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate leading-none">
                    {songTitle || settings.heroTitleMain || "BENTO PLAYER"}
                  </span>
                </div>

                <div className="w-[1px] h-4 bg-white/15 shrink-0" />

                {/* Play/Pause icon */}
                <div className="text-white shrink-0 flex items-center justify-center">
                  {isMuted ? (
                    <Play size={12} fill="currentColor" className="ml-0.5 text-white/80" />
                  ) : (
                    <Pause size={12} fill="currentColor" className="text-white" />
                  )}
                </div>

                {/* Progress bar line running along the bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10 overflow-hidden">
                  <div className="h-full bg-primary-red transition-all duration-300" style={{ width: `${playerProgress}%` }} />
                </div>
              </div>

              <div id="youtube-player" className="hidden" />
            </motion.div>
          )}

          <motion.div style={{ rotateX, rotateY, textShadow, transformStyle: "preserve-3d" }} className="relative z-10 flex justify-center md:justify-start">
            <motion.h1 
              style={{ 
                color: textFinalColor,
                backgroundImage: textBgImage,
                WebkitBackgroundClip: textBgClip as any,
                backgroundClip: textBgClip as any,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }} 
              className="font-serif italic font-light text-[22vw] md:text-[200px] lg:text-[250px] leading-[0.8] tracking-tight select-none relative z-10"
            >
              {settings.heroTitleMain}
            </motion.h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.2 }} className="absolute -top-12 md:-top-32 left-[10%] md:left-[15%] z-20 pointer-events-none">
            <motion.h2 
              style={{ 
                color: hasTextImg ? textFinalColor : lolaColor,
                backgroundImage: textBgImage,
                WebkitBackgroundClip: textBgClip as any,
                backgroundClip: textBgClip as any,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                textShadow
              }} 
              className="font-serif font-medium text-4xl md:text-7xl lg:text-[120px] opacity-90 select-none tracking-widest uppercase"
            >
              {settings.heroTitleSub}
            </motion.h2>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }} className="mt-16 md:mt-32 max-w-2xl self-center md:self-start text-center md:text-left">
          <motion.p style={{ color: textColor }} className="text-xl md:text-4xl font-serif italic tracking-wide leading-relaxed mb-6 md:mb-8">{parseMarkdown(settings.profession)}</motion.p>
          {settings.bio && <motion.p style={{ color: secondaryTextColor }} className="text-sm md:text-lg font-light leading-relaxed max-w-xl px-4 md:px-0 tracking-wide">{parseMarkdown(settings.bio)}</motion.p>}
          <motion.div style={{ backgroundColor: textColor }} className="h-[1px] w-24 mt-8 md:mt-12 opacity-30 mx-auto md:mx-0"></motion.div>
        </motion.div>
      </section>

      <div className="max-w-[1600px] mx-auto w-full space-y-32 md:space-y-48">
        {(settings.sectionsConfig || []).filter(s => s.visible).map((section) => {
          if (section.id === 'projects') return (
            <div key="projects" id="projects" className="scroll-mt-36 md:scroll-mt-44">
              <Projects config={settings} label={section.label} subLabel={section.subLabel} textColor={textColor} secondaryTextColor={secondaryTextColor} />
            </div>
          );
          
          if (section.id === 'shop' && products.length > 0) return (
            <section key="shop" id="shop" className="relative z-10 scroll-mt-36 md:scroll-mt-44">
              <div className="flex justify-center md:justify-start mb-16">
                <div className="inline-flex items-center gap-4 bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 px-6 py-3.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300">
                  <span className="w-2.5 h-2.5 bg-primary-red rounded-full animate-pulse shadow-[0_0_10px_var(--primary-red)]"></span>
                  <motion.h2 style={{ color: textColor }} className="font-serif text-xl md:text-2xl tracking-tight leading-none italic">{section.label}</motion.h2>
                  <div className="w-[1px] h-5 bg-white/15" />
                  <motion.p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">{section.subLabel}</motion.p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((product) => (
                  <motion.div 
                    key={product.id} 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true }} 
                    onClick={() => { setSelectedProduct(product); setActiveProdImg(0); }}
                    className="group bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 rounded-3xl overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_50px_rgba(0,0,0,0.8)] cursor-pointer hover:bg-[#0c0c0c]/95 transition-all duration-500 hover:scale-[1.01]"
                  >
                    <div className="relative aspect-square overflow-hidden m-4 rounded-xl">
                      <Image src={product.images[0] || ""} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
                      <div className="absolute top-4 right-4 bg-primary-red text-white px-4 py-2 text-sm font-bold shadow-xl rounded-lg border border-white/20">{product.price}€</div>
                    </div>
                    <div className="p-8 pt-4 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-primary-red rounded-full"></span>
                        <motion.h3 style={{ color: textColor }} className="font-serif text-2xl leading-tight">{product.name}</motion.h3>
                      </div>
                      <motion.p className="text-[10px] font-bold uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">Voir les détails</motion.p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          );

          if (section.id === 'gallery' && galleryMedia.length > 0) {
            const itemsPerPage = 5;
            const totalPages = Math.ceil(galleryMedia.length / itemsPerPage);
            const currentItems = galleryMedia.slice(galleryIndex * itemsPerPage, (galleryIndex + 1) * itemsPerPage);

            return (
              <section key="gallery" id="gallery" className="relative scroll-mt-36 md:scroll-mt-44">
                <div className="flex justify-between items-center mb-16 gap-4"> 
                  <div className="inline-flex items-center gap-4 bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 px-6 py-3.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300">
                    <span className="w-2.5 h-2.5 bg-primary-red rounded-full animate-pulse shadow-[0_0_10px_var(--primary-red)]"></span>
                    <motion.h2 style={{ color: textColor }} className="font-serif text-xl md:text-2xl tracking-tight leading-none italic">{section.label}</motion.h2>
                    <div className="w-[1px] h-5 bg-white/15" />
                    <motion.span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">{section.subLabel}</motion.span>
                  </div>
                  {/* Custom Premium Arrows - Capsule Style like the Category Bar! */}
                  {totalPages > 1 && (
                    <div className="flex items-center bg-black/45 backdrop-blur-xl border border-white/10 px-2.5 py-1.5 rounded-full shadow-2xl transition-all duration-300">
                      <button 
                        onClick={() => setGalleryIndex(prev => (prev - 1 + totalPages) % totalPages)}
                        type="button"
                        className="px-3 py-1 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-all"
                      >
                        <ArrowUpRight size={16} style={{ transform: 'rotate(-135deg)' }} />
                      </button>
                      <div className="w-[1px] h-4 bg-white/10 mx-1.5" />
                      <button 
                        onClick={() => setGalleryIndex(prev => (prev + 1) % totalPages)}
                        type="button"
                        className="px-3 py-1 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-all"
                      >
                        <ArrowUpRight size={16} style={{ transform: 'rotate(45deg)' }} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Bento Grid with sliding horizontal transitions */}
                <div className="relative overflow-hidden w-full">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={galleryIndex}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -40 }}
                      transition={{ duration: 0.5, ease: "easeInOut" }}
                      className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 md:h-[650px] lg:h-[800px]"
                    >
                      {currentItems.map((item, i) => {
                        const ytId = getYoutubeId(item.url);
                        const displayUrl = ytId ? getYoutubeThumbnail(ytId) : item.url;
                        
                        // Bento layout patterns
                        let gridClass = "md:col-span-1 md:row-span-1";
                        if (i === 0) gridClass = "md:col-span-2 md:row-span-2";
                        else if (i === 1) gridClass = "md:col-span-2 md:row-span-1";

                        return (
                          <motion.div 
                            key={item.id} 
                            initial={{ opacity: 0, scale: 0.95 }} 
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }} 
                            onClick={() => setSelectedImage(item)} 
                            className={`relative overflow-hidden rounded-xl bg-black/20 backdrop-blur-md border border-white/10 group cursor-zoom-in aspect-square md:aspect-auto shadow-xl hover:shadow-2xl hover:bg-black/40 transition-all duration-500 ${gridClass}`}
                          >
                            <Image src={displayUrl} alt={item.name || ""} fill className="object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100" unoptimized />
                            
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            
                            {ytId && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-12 h-12 md:w-16 md:h-16 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:bg-primary-red transition-all duration-500 border border-white/30">
                                  <Play size={24} fill="currentColor" className="ml-1" />
                                </div>
                              </div>
                            )}

                            {/* Card Details Overlay - Only display real names */}
                            {item.name && item.name !== "URL Image" && item.name !== "Vidéo YouTube" && (
                              <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 transform translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="bg-black/60 backdrop-blur-xl border border-white/5 p-4 rounded-lg shadow-2xl max-w-[280px]">
                                  <h3 className="text-white font-serif text-sm md:text-lg leading-tight truncate tracking-wide">
                                    {item.name}
                                  </h3>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                      {/* Fill empty slots to maintain layout consistency */}
                      {currentItems.length < 5 && Array.from({ length: 5 - currentItems.length }).map((_, i) => (
                         <div key={`empty-${i}`} className="hidden md:block bg-white/[0.02] border border-dashed border-white/10 rounded-3xl" />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Bullet Page Indicators */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-8">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setGalleryIndex(idx)}
                        type="button"
                        className={`h-2 rounded-full transition-all duration-500 ${
                          galleryIndex === idx ? "w-8 bg-primary-red" : "w-2 bg-white/20 hover:bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          }

          if (section.id === 'comments') return (
            <section key="comments" id="comments" className="relative z-10 scroll-mt-36 md:scroll-mt-44">
              <div className="flex justify-center md:justify-start mb-16">
                <div className="inline-flex items-center gap-4 bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 px-6 py-3.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300">
                  <span className="w-2.5 h-2.5 bg-primary-red rounded-full animate-pulse shadow-[0_0_10px_var(--primary-red)]"></span>
                  <motion.h2 style={{ color: textColor }} className="font-serif text-xl md:text-2xl tracking-tight leading-none italic">{section.label}</motion.h2>
                  <div className="w-[1px] h-5 bg-white/15" />
                  <motion.p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">{section.subLabel}</motion.p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submit comment form column */}
                <div className="lg:col-span-1">
                  <div className="bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 md:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden lg:sticky lg:top-36">
                    <h3 className="font-serif text-2xl text-white mb-6 italic">Partager un avis</h3>
                    
                    {user ? (
                      <form onSubmit={handleCommentSubmit} className="space-y-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 overflow-hidden relative shrink-0">
                            {userProfileImage ? (
                              <Image src={userProfileImage} alt="Profile" fill className="object-cover" unoptimized />
                            ) : (
                              <User size={14} className="m-auto mt-2 text-white/40" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[9px] font-bold uppercase tracking-widest text-primary-red">Connecté</p>
                            <p className="text-xs text-white/60 truncate">{user.email}</p>
                          </div>
                        </div>

                        <textarea
                          value={commentContent}
                          onChange={(e) => setCommentContent(e.target.value)}
                          placeholder="Écrivez un message ou laissez un commentaire..."
                          rows={4}
                          maxLength={300}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-red focus:bg-white/10 transition-all text-white placeholder-white/50 font-medium resize-none"
                        />
                        <div className="text-[9px] text-right text-white/40 font-bold tracking-widest mt-1">
                          {commentContent.length}/300
                        </div>

                        {/* Image Attachment System */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Image Jointe</span>
                            <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                              <button
                                type="button"
                                onClick={() => setCommentImgMode('upload')}
                                className={`text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md transition-all ${commentImgMode === 'upload' ? 'bg-primary-red text-white' : 'text-white/40 hover:text-white'}`}
                              >
                                Importer
                              </button>
                              <button
                                type="button"
                                onClick={() => setCommentImgMode('url')}
                                className={`text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md transition-all ${commentImgMode === 'url' ? 'bg-primary-red text-white' : 'text-white/40 hover:text-white'}`}
                              >
                                URL
                              </button>
                            </div>
                          </div>

                          {commentImgMode === 'upload' ? (
                            <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                              <span className="text-[10px] text-white/40">Fichier local</span>
                              <label className="cursor-pointer text-[10px] font-bold text-primary-red uppercase tracking-widest flex items-center gap-1.5 hover:text-primary-green-400 transition-colors">
                                <Upload size={12} /> Choisir une image
                                <input type="file" className="hidden" accept="image/*" onChange={handleCommentImageUpload} />
                              </label>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={commentImageUrl}
                              onChange={(e) => setCommentImageUrl(e.target.value)}
                              placeholder="Coller l'URL de l'image..."
                              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-[10px] outline-none focus:border-primary-red transition-all text-white placeholder-white/40 font-medium"
                            />
                          )}

                          {commentImageUrl && (
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20 group mt-2">
                              <Image src={commentImageUrl} alt="Attachment Preview" fill className="object-cover" unoptimized />
                              <button
                                type="button"
                                onClick={() => setCommentImageUrl("")}
                                className="absolute inset-0 bg-primary-green/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingComment || isCompressing}
                          className="w-full bg-white text-black font-bold uppercase tracking-widest text-[10px] py-4 rounded-2xl hover:bg-primary-red hover:text-white transition-all shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmittingComment ? "ENVOI..." : isCompressing ? "COMPRESSION..." : <>PUBLIER <Send size={12} /></>}
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-6 space-y-4">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto text-white/30">
                          <MessageSquare size={20} />
                        </div>
                        <p className="text-xs text-white/60 leading-relaxed">
                          Connectez-vous ou créez un compte pour laisser un avis et partager des images sur le portfolio.
                        </p>
                        <button
                          onClick={() => { setIsSignUp(false); setIsAuthModalOpen(true); }}
                          className="w-full bg-primary-red hover:bg-primary-green text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-2xl transition-all shadow-lg"
                        >
                          SE CONNECTER
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Comments list column */}
                <div className="lg:col-span-2 space-y-6">
                  {comments.filter(c => !c.parent_id && c.validated !== false && (!c.deleted_by_user || comments.some(r => r.parent_id === c.id && !r.deleted_by_user && r.validated !== false))).length === 0 ? (
                    <div className="bg-[#0c0c0c]/85 backdrop-blur-2xl border border-dashed border-white/15 rounded-3xl p-12 text-center text-white/90 font-semibold italic shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)]">
                      Aucun commentaire pour le moment. Soyez le premier à vous exprimer !
                    </div>
                  ) : (
                    comments
                      .filter(c => !c.parent_id && c.validated !== false && (!c.deleted_by_user || comments.some(r => r.parent_id === c.id && !r.deleted_by_user && r.validated !== false)))
                      .map((comment) => {
                        const isAuthor = user?.id === comment.user_id;
                        const isAdmin = ['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(user?.email);
                        const canDelete = isAuthor || isAdmin;
                        const dateFormatted = new Date(comment.created_at).toLocaleDateString("fr-FR", {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        const commentLikes = comment.likes || [];
                        const hasLiked = user ? commentLikes.includes(user.id) : false;

                        // Fetch replies for this specific comment
                        const commentReplies = comments
                          .filter(c => c.parent_id === comment.id && !c.deleted_by_user && c.validated !== false)
                          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                        const isDeleted = comment.deleted_by_user;
                        return (
                          <div key={comment.id} className="space-y-4">
                            {/* Main Top-Level Comment */}
                            <div className="bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 md:p-8 flex gap-4 md:gap-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] relative group hover:bg-[#0c0c0c]/95 transition-all duration-300">
                              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/10 border border-white/20 overflow-hidden relative shrink-0 flex items-center justify-center">
                                {comment.avatar_url && !isDeleted ? (
                                  <Image src={comment.avatar_url} alt={comment.user_name} fill className="object-cover" unoptimized />
                                ) : (
                                  <User size={18} className="text-white/40" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="text-sm font-bold text-white leading-none flex items-center gap-2">
                                      {isDeleted ? (
                                        <span className="text-white/50 italic font-medium">Commentaire supprimé</span>
                                      ) : (
                                        <>
                                          {comment.user_name}
                                          {['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(comment.user_email) && (
                                            <span className="text-[8px] bg-primary-red/20 text-primary-red px-2 py-0.5 rounded-full border border-primary-red/20 font-bold uppercase tracking-widest">
                                              Admin
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </h4>
                                    <span className="text-[9px] uppercase tracking-widest text-white/40 block mt-1.5">
                                      {dateFormatted}
                                    </span>
                                  </div>

                                  {canDelete && !isDeleted && (
                                    <button
                                      onClick={() => handleCommentDelete(comment.id)}
                                      className="p-2 bg-white/5 hover:bg-primary-green/20 text-white/40 hover:text-primary-green rounded-full transition-all opacity-0 group-hover:opacity-100"
                                      title="Supprimer ce commentaire"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>

                                {isDeleted ? (
                                  <p className="text-sm text-white/30 italic font-normal leading-relaxed">
                                    Ce message a été supprimé par l'utilisateur.
                                  </p>
                                ) : (
                                  <>
                                    {comment.content && comment.content.trim() && (
                                      <p className="text-sm text-white font-medium leading-relaxed whitespace-pre-wrap break-words">
                                        {parseMarkdown(comment.content)}
                                      </p>
                                    )}

                                    {comment.image_url && (
                                      <div
                                        onClick={() => setSelectedImage({ url: comment.image_url, name: `Image de ${comment.user_name}` } as any)}
                                        className="relative max-w-sm aspect-video rounded-2xl overflow-hidden border border-white/10 group cursor-zoom-in mt-3 shadow-lg"
                                      >
                                        <Image src={comment.image_url} alt="Attached Media" fill className="object-cover group-hover:scale-102 transition-transform" unoptimized />
                                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <Maximize2 size={20} className="text-white drop-shadow-md" />
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}

                                {/* Likes & Reply Actions Footer */}
                                <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                                  {!isDeleted && (
                                    <button
                                      onClick={() => handleCommentLike(comment)}
                                      className="flex items-center gap-1.5 group/like text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                    >
                                      <Heart size={14} className={hasLiked ? "fill-primary-red text-primary-red" : "text-white/40 group-hover/like:text-white transition-colors"} />
                                      <span>{commentLikes.length}</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      if (replyingToId === comment.id) {
                                        setReplyingToId(null);
                                      } else {
                                        setReplyingToId(comment.id);
                                        setReplyingToName(isDeleted ? "Commentaire supprimé" : comment.user_name);
                                      }
                                    }}
                                    className="flex items-center gap-1.5 group/reply text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                  >
                                    <MessageSquare size={13} className="text-white/40 group-hover/reply:text-white transition-colors" />
                                    <span>Répondre</span>
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Reply Input Form nested directly inside card container */}
                            {replyingToId === comment.id && (
                              <div className="bg-[#111111] border border-white/15 rounded-2xl p-5 ml-8 md:ml-12 space-y-4 shadow-2xl">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/70">Répondre à <span className="text-primary-red">{replyingToName}</span></p>
                                <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="space-y-4">
                                  <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder="Écrivez votre réponse..."
                                    rows={2}
                                    maxLength={300}
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-xs outline-none focus:border-primary-red focus:bg-white/10 transition-all text-white placeholder-white/50 font-medium resize-none"
                                  />
                                  <div className="text-[9px] text-right text-white/40 font-bold tracking-widest -mt-2 mb-2">
                                    {replyContent.length}/300
                                  </div>                                  {/* Compact Reply Attachment system */}
                                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                      <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">Média</span>
                                      <div className="flex bg-white/5 rounded-md p-0.5 border border-white/5">
                                        <button
                                          type="button"
                                          onClick={() => setReplyImgMode('upload')}
                                          className={`text-[8px] font-bold px-2 py-0.5 rounded transition-all ${replyImgMode === 'upload' ? 'bg-primary-red text-white' : 'text-white/40'}`}
                                        >
                                          Local
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setReplyImgMode('url')}
                                          className={`text-[8px] font-bold px-2 py-0.5 rounded transition-all ${replyImgMode === 'url' ? 'bg-primary-red text-white' : 'text-white/40'}`}
                                        >
                                          URL
                                        </button>
                                      </div>
                                    </div>

                                    <div className="flex-1 min-w-[120px]">
                                      {replyImgMode === 'upload' ? (
                                        <label className="cursor-pointer text-[9px] font-bold text-primary-red uppercase tracking-widest flex items-center gap-1 hover:text-primary-green-400 justify-end">
                                          <Upload size={10} /> Choisir...
                                          <input type="file" className="hidden" accept="image/*" onChange={handleReplyImageUpload} />
                                        </label>
                                      ) : (
                                        <input
                                          type="text"
                                          value={replyImageUrl}
                                          onChange={(e) => setReplyImageUrl(e.target.value)}
                                          placeholder="URL de l'image..."
                                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg p-1.5 text-[9px] outline-none focus:border-primary-red text-white placeholder-white/40 font-medium"
                                        />
                                      )}
                                    </div>
                                  </div>

                                  {replyImageUrl && (
                                    <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group mt-1">
                                      <Image src={replyImageUrl} alt="Reply Attachment" fill className="object-cover" unoptimized />
                                      <button
                                        type="button"
                                        onClick={() => setReplyImageUrl("")}
                                        className="absolute inset-0 bg-primary-green/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  )}

                                  <div className="flex justify-end gap-2.5 pt-2">
                                    <button
                                      type="button"
                                      onClick={() => setReplyingToId(null)}
                                      className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
                                    >
                                      Annuler
                                    </button>
                                    <button
                                      type="submit"
                                      className="px-3.5 py-2 bg-primary-red hover:bg-primary-green text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
                                    >
                                      Répondre
                                    </button>
                                  </div>
                                </form>
                              </div>
                            )}

                            {/* Nested Replies List */}
                            {commentReplies.length > 0 && (
                              <div className="space-y-4 pl-8 md:pl-12 border-l border-white/5 ml-5 md:ml-6">
                                {commentReplies.map((reply) => {
                                  const isReplyAuthor = user?.id === reply.user_id;
                                  const canDeleteReply = isReplyAuthor || isAdmin;
                                  const replyDateFormatted = new Date(reply.created_at).toLocaleDateString("fr-FR", {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });
                                  const replyLikes = reply.likes || [];
                                  const hasReplyLiked = user ? replyLikes.includes(user.id) : false;

                                  return (
                                    <div key={reply.id} className="bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-5 md:p-6 flex gap-3.5 md:gap-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_32px_rgba(0,0,0,0.5)] relative group hover:bg-[#0c0c0c]/95 transition-all duration-300">
                                      <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10 overflow-hidden relative shrink-0 flex items-center justify-center">
                                        {reply.avatar_url ? (
                                          <Image src={reply.avatar_url} alt={reply.user_name} fill className="object-cover" unoptimized />
                                        ) : (
                                          <User size={14} className="text-white/40" />
                                        )}
                                      </div>

                                      <div className="flex-1 min-w-0 space-y-2">
                                        <div className="flex justify-between items-start">
                                          <div>
                                            <h5 className="text-xs font-bold text-white leading-none flex items-center gap-1.5">
                                              {reply.user_name}
                                              {['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(reply.user_email) && (
                                                <span className="text-[7px] bg-primary-red/20 text-primary-red px-1.5 py-0.5 rounded-full border border-primary-red/20 font-bold uppercase tracking-widest">
                                                  Admin
                                                </span>
                                              )}
                                            </h5>
                                            <span className="text-[8px] uppercase tracking-widest text-white/40 block mt-1">
                                              {replyDateFormatted}
                                            </span>
                                          </div>

                                          {canDeleteReply && (
                                            <button
                                              onClick={() => handleCommentDelete(reply.id)}
                                              className="p-1.5 bg-white/5 hover:bg-primary-green/20 text-white/40 hover:text-primary-green rounded-full transition-all opacity-0 group-hover:opacity-100"
                                              title="Supprimer ce commentaire"
                                            >
                                              <Trash2 size={10} />
                                            </button>
                                          )}
                                        </div>

                                        {reply.content && reply.content.trim() && (
                                          <p className="text-xs text-white font-medium leading-relaxed whitespace-pre-wrap break-words">
                                            {parseMarkdown(reply.content)}
                                          </p>
                                        )}

                                        {reply.image_url && (
                                          <div
                                            onClick={() => setSelectedImage({ url: reply.image_url, name: `Image de ${reply.user_name}` } as any)}
                                            className="relative max-w-xs aspect-video rounded-xl overflow-hidden border border-white/10 group cursor-zoom-in mt-2 shadow-md"
                                          >
                                            <Image src={reply.image_url} alt="Attached Reply Media" fill className="object-cover group-hover:scale-102 transition-transform" unoptimized />
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                              <Maximize2 size={16} className="text-white drop-shadow-md" />
                                            </div>
                                          </div>
                                        )}

                                        {/* Likes Actions for Reply */}
                                        <div className="flex items-center gap-3 pt-1">
                                          <button
                                            onClick={() => handleCommentLike(reply)}
                                            className="flex items-center gap-1 group/reply-like text-[9px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                          >
                                            <Heart size={12} className={hasReplyLiked ? "fill-primary-red text-primary-red" : "text-white/40 group-hover/reply-like:text-white transition-colors"} />
                                            <span>{replyLikes.length}</span>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </section>
          );

          if (section.id === 'bento') return (
            <section key="bento" id="bento" className="relative z-10 scroll-mt-28 md:scroll-mt-36">
              <div className="flex justify-center md:justify-start mb-16">
                <div className="inline-flex items-center gap-4 bg-[#0c0c0c]/85 backdrop-blur-2xl border border-white/15 px-6 py-3.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_12px_40px_rgba(0,0,0,0.6)] transition-all duration-300">
                  <span className="w-2.5 h-2.5 bg-primary-red rounded-full animate-pulse shadow-[0_0_10px_var(--primary-red)]"></span>
                  <motion.h2 className="font-serif text-xl md:text-2xl text-white tracking-tight leading-none italic">{section.label}</motion.h2>
                  <div className="w-[1px] h-5 bg-white/15" />
                  <motion.p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">{section.subLabel}</motion.p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-2 aspect-square md:aspect-video bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl p-12 flex flex-col justify-between group overflow-hidden relative shadow-2xl hover:bg-black/30 transition-all">
                  <div className="relative z-10"> <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--primary-red)] mb-4">Ma Bio</p> <h3 className="font-serif text-3xl md:text-5xl leading-tight mb-6 text-white">{parseMarkdown(settings.bio || "Exploration créative et solutions techniques.")}</h3> </div>
                  <Socials config={socialsConfig} color={textColor} />
                </div>
                <div className="aspect-square bg-[var(--primary-red)]/90 backdrop-blur-md border border-white/20 rounded-2xl p-10 flex flex-col justify-between text-white relative overflow-hidden group shadow-2xl hover:bg-[var(--primary-red)] transition-all">
                  <motion.div initial={{ scale: 1 }} whileHover={{ scale: 1.1 }} className="absolute -right-8 -bottom-8 opacity-20"><Zap size={200} fill="white" /></motion.div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] relative z-10">Disponibilité</p>
                  <h3 className="font-serif text-4xl italic relative z-10">Ouvert aux projets freelance</h3>
                </div>
                <div className="aspect-square bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl p-10 flex flex-col justify-between text-white relative overflow-hidden group shadow-2xl hover:bg-black/30 transition-all">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Contact</p>
                  <div className="space-y-4 relative z-10">
                    <p className="font-serif text-2xl truncate">{settings.email || "lolapeloille@gmail.com"}</p>
                    <button onClick={copyEmail} className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:text-primary-red transition-colors"> {copied ? <><Check size={14} /> Copié</> : <><Copy size={14} /> Copier l'email</>} </button>
                  </div>
                </div>
              </div>
            </section>
          );
          
          return null;
        })}

        <footer className="pt-16 border-t border-text-black/10 flex flex-col md:flex-row justify-between items-center md:items-end gap-12 w-full pb-16">
          <div className="max-w-md text-center md:text-left relative">
            <motion.h3 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="font-serif text-3xl md:text-4xl text-soft-black mb-6">Discutons de votre projet.</motion.h3>
            <div className="relative inline-block">
              <button onClick={copyEmail} className="group flex items-center gap-3 text-lg md:text-xl border-b border-primary-red text-text-black hover:text-primary-red transition-all pb-1 font-medium"> {settings.email || "lolapeloille@gmail.com"} <Copy size={16} className="opacity-0 group-hover:opacity-40 transition-opacity" /> </button>
              <AnimatePresence> {copied && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: -10 }} exit={{ opacity: 0, y: 0 }} className="absolute -top-12 left-0 bg-text-black text-white px-4 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl"><Check size={12} className="text-green-500" /> Email Copié !</motion.div>} </AnimatePresence>
            </div>
          </div>
          <Socials config={socialsConfig} color={textColor} />
        </footer>
      </div>
    </motion.main>
  );
}
