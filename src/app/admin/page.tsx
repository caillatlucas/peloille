"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Settings, FileText, ImageIcon, 
  LogOut, Check, X as CloseIcon, X, Edit2, Trash2, Upload, AlertCircle, Link as LinkIcon,
  Share2, Mail, MessageSquare, Zap, User, Clock, Music, Play, Pause, Send, ArrowLeft,
  Download, ExternalLink, Users, Phone, Heart, Activity, ShoppingCart
} from "lucide-react";
import { FaLinkedin, FaGithub, FaTwitter, FaInstagram, FaYoutube, FaTiktok, FaGlobe, FaDiscord, FaPhone } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SocialConfig, ICON_MAP } from "@/components/Socials";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG } from 'qrcode.react';

interface Project {
  id: string;
  title: string;
  category?: string;
  date: string;
  image: string;
  status: "Publié" | "Brouillon";
  link_type: "external" | "internal";
  url: string;
  content: string;
  gallery: { url: string; type: 'image' | 'video' }[];
}

interface MediaItem {
  id: string;
  url: string;
  name: string;
  created_at: string;
}

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
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  link?: string;
  link_text?: string;
  purchase_message?: string;
  created_at?: string;
}


export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("stats");
  const [projects, setProjects] = useState<Project[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [replyMedia, setReplyMedia] = useState<{ [key: string]: { url: string; type: 'image' | 'video' }[] }>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [selectedUserHistory, setSelectedUserHistory] = useState<any | null>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [selectedAttachment, setSelectedAttachment] = useState<string | null>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const router = useRouter();
  
  const [profileName, setProfileName] = useState("Lola Peloille");
  const [profileProfession, setProfileProfession] = useState("Artiste peintre");
  const [profileBio, setProfileBio] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [heroTitleMain, setHeroTitleMain] = useState("PELOILLE");
  const [heroTitleSub, setHeroTitleSub] = useState("Lucas");
  const [textEffectImage, setTextEffectImage] = useState("");
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [musicUrl, setMusicUrl] = useState("");
  const [musicCover, setMusicCover] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#606c38");
  const [show3DBackground, setShow3DBackground] = useState(false);
  const [musicRotationEnabled, setMusicRotationEnabled] = useState(true);
  const [statueTextureUrl, setStatueTextureUrl] = useState("");
  const [statueModelUrl, setStatueModelUrl] = useState("");
  const [useOriginalMaterial, setUseOriginalMaterial] = useState(false);
  const [requireCommentValidation, setRequireCommentValidation] = useState(false);
  const [sectionsConfig, setSectionsConfig] = useState([
    { id: 'projects', label: 'Projets', subLabel: 'Sélection 2024', visible: true },
    { id: 'shop', label: 'Boutique', subLabel: 'Nos Produits', visible: true },
    { id: 'gallery', label: 'Galerie', subLabel: 'Galerie Photo/Vidéo', visible: true },
    { id: 'bento', label: 'À propos', subLabel: 'Bento Grid', visible: true }
  ]);

  const [socials, setSocials] = useState<SocialConfig>({
    email: "contact@lucasPELOILLE.fr",
    linkedin: { url: "https://linkedin.com/in/lucasPELOILLE", enabled: true },
    github: { url: "https://github.com/lucasPELOILLE", enabled: true },
    twitter: { url: "https://twitter.com/lucasPELOILLE", enabled: false },
    instagram: { url: "https://instagram.com/lucasPELOILLE", enabled: false },
    youtube: { url: "", enabled: false },
    tiktok: { url: "", enabled: false },
    discord: { url: "", enabled: false },
    phone: { url: "", enabled: false },
    customLinks: []
  });

  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formStatus, setFormStatus] = useState<"Publié" | "Brouillon">("Publié");
  const [formLinkType, setFormLinkType] = useState<"external" | "internal">("internal");
  const [formUrl, setFormUrl] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formGallery, setFormGallery] = useState<{ url: string; type: 'image' | 'video' }[]>([]);
  const [formDetails, setFormDetails] = useState("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [prodName, setProdName] = useState("");
  const [prodPrice, setProdPrice] = useState(0);
  const [prodDesc, setProdDesc] = useState("");
  const [prodImages, setProdImages] = useState<string[]>([]);
  const [prodImagesText, setProdImagesText] = useState("");
  const [prodLink, setProdLink] = useState("");
  const [prodLinkText, setProdLinkText] = useState("");
  const [prodPurchaseMsg, setProdPurchaseMsg] = useState("");

  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [mfaEnrollment, setMfaEnrollment] = useState<any>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");

  const [ipHistoryUserId, setIpHistoryUserId] = useState<string | null>(null);
  const [ipHistoryData, setIpHistoryData] = useState<{ ip: string; last_sign_in: string }[]>([]);
  const [isFetchingIps, setIsFetchingIps] = useState(false);

  const fetchIpHistory = async (userId: string) => {
    setIpHistoryUserId(userId);
    setIsFetchingIps(true);
    setIpHistoryData([]);
    try {
      // Appel d'une fonction RPC Supabase (nécessite une fonction SQL côté serveur)
      const { data, error } = await supabase.rpc('get_user_ips', { target_user_id: userId });
      if (error) {
        console.error("Détail de l'erreur RPC:", error);
        alert(`Erreur Supabase: ${error.message}\n\nDétails techniques: ${error.details || 'Aucun'}\nCode: ${error.code}`);
      } else if (data) {
        setIpHistoryData(data);
      }
    } catch (err) {
      console.error(err);
    }
    setIsFetchingIps(false);
  };

  const [isGlobalIpModalOpen, setIsGlobalIpModalOpen] = useState(false);
  const [globalIpData, setGlobalIpData] = useState<{ ip: string; visited_at: string }[]>([]);
  const [isFetchingGlobalIps, setIsFetchingGlobalIps] = useState(false);

  const fetchGlobalIps = async () => {
    setIsGlobalIpModalOpen(true);
    setIsFetchingGlobalIps(true);
    try {
      const { data, error } = await supabase.rpc('get_all_site_visits');
      if (error) {
        console.error(error);
        alert(`Erreur: ${error.message}\nAvez-vous créé la fonction SQL 'get_all_site_visits' ?`);
      } else if (data) {
        setGlobalIpData(data);
      }
    } catch (err) {
      console.error(err);
    }
    setIsFetchingGlobalIps(false);
  };

  useEffect(() => {
    const checkAuth = async () => {
      // Allow local bypass
      if (typeof window !== 'undefined' && localStorage.getItem('admin_auth') === 'true') {
        fetchData();
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push("/admin/login");
          return;
        } 
        if (session.user.email !== 'caillatlucas2304@gmail.com') {
          router.push("/");
          return;
        }
        const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (mfaError) {
          console.error("Erreur check MFA:", mfaError);
        } else if (mfaData.nextLevel === 'aal2' && mfaData.currentLevel !== 'aal2') {
          router.push("/admin/login");
          return;
        }
        fetchData();
      } catch (err) {
        console.error("Supabase not configured or failed", err);
        router.push("/admin/login");
      }
    };
    checkAuth();

    const fetchMfa = async () => {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors) setMfaFactors(factors.all.filter(f => f.status === 'verified'));
    };
    fetchMfa();

    const msgChannel = supabase.channel('admin-msgs')
      .on('postgres_changes', { event: '*', table: 'messages', schema: 'public' }, () => {
        fetchData();
      })
      .subscribe();

    const commentsChannel = supabase.channel('admin-comments')
      .on('postgres_changes', { event: '*', table: 'comments', schema: 'public' }, () => {
        fetchComments();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [router]);

  const getYoutubeId = (url: string) => { 
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/); 
    return (match && match[2].length === 11) ? match[2] : null; 
  };
  const getYoutubeThumbnail = (id: string) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

  const fetchComments = async () => {
    const { data: cData } = await supabase.from('comments').select('*').order('created_at', { ascending: false });
    if (cData) {
      const userIds = Array.from(new Set(cData.map((c: any) => c.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: profData } = await supabase.from('profiles').select('id, avatar_url, full_name').in('id', userIds);
        if (profData) {
          const enriched = cData.map((c: any) => {
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
  };

  const fetchData = async () => {
    fetchComments();
    const { data: pData } = await supabase.from('projects').select('*');
    const { data: prodData } = await supabase.from('products').select('*');
    const { data: msgData } = await supabase.from('messages').select('*').order('created_at', { ascending: false });
    const { data: sData } = await supabase.from('settings').select('*');
    
    if (msgData) {
      setMessages(msgData);
      const userIds = Array.from(new Set(msgData.map((m: any) => m.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: profData } = await supabase.from('profiles').select('id, avatar_url, full_name').in('id', userIds);
        if (profData) {
          const enriched = msgData.map((m: any) => ({
            ...m,
            profiles: profData.find(p => p.id === m.user_id)
          }));
          setMessages(enriched);
        }
      }
    }

    const { data: allP } = await supabase.from('profiles').select('*');
    if (allP) setAllProfiles(allP);

    const { data: vData } = await supabase.rpc('get_all_site_visits');
    if (vData) setVisits(vData);

    if (sData) {
      const global = sData.find(s => s.key === 'global')?.value;
      if (global) {
        if (pData && global.projectOrder) {
          pData.sort((a, b) => {
            const idxA = global.projectOrder.indexOf(a.id);
            const idxB = global.projectOrder.indexOf(b.id);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });
        }
        if (prodData && global.productOrder) {
          prodData.sort((a, b) => {
            const idxA = global.productOrder.indexOf(a.id);
            const idxB = global.productOrder.indexOf(b.id);
            if (idxA === -1 && idxB === -1) return 0;
            if (idxA === -1) return 1;
            if (idxB === -1) return -1;
            return idxA - idxB;
          });
        }
        setProfileName(global.profileName || "Lola Peloille");
        setProfileProfession(global.profileProfession || global.profession || "Artiste peintre");
        setProfileBio(global.profileBio || global.bio || "");
        setProfileImage(global.profileImage || "");
        setHeroTitleMain(global.heroTitleMain || "PELOILLE");
        setHeroTitleSub(global.heroTitleSub || "Lucas");
        setTextEffectImage(global.textEffectImage || "");
        setMusicEnabled(global.musicEnabled || false);
        setMusicUrl(global.musicUrl || "");
        setMusicCover(global.musicCover || "");
        setPrimaryColor(global.primaryColor || "#606c38");
        setShow3DBackground(global.show3DBackground ?? false);
        setMusicRotationEnabled(global.musicRotationEnabled ?? true);
        setStatueTextureUrl(global.statueTextureUrl || "");
        setStatueModelUrl(global.statueModelUrl || "");
        setUseOriginalMaterial(global.useOriginalMaterial ?? false);
        setRequireCommentValidation(global.requireCommentValidation ?? false);
        if (global.sectionsConfig) {
          const hasComments = global.sectionsConfig.some((s: any) => s.id === 'comments');
          let migratedSections = global.sectionsConfig.map((s: { id: string; label: string; subLabel?: string; visible: boolean }) => {
            if (s.id === 'projects' && s.subLabel === undefined) return { ...s, subLabel: global.projectsTitle || "Sélection 2024", label: global.recentProjectsTitle || "Postes" };
            if (s.id === 'gallery' && s.subLabel === undefined) return { ...s, subLabel: "Galerie Photo/Vidéo", label: global.galleryTitle || s.label };
            if (s.id === 'shop' && s.subLabel === undefined) return { ...s, subLabel: "Nos Produits" };
            if (s.id === 'comments' && s.subLabel === undefined) return { ...s, subLabel: "Vos Retours" };
            if (s.id === 'bento' && s.subLabel === undefined) return { ...s, subLabel: "Bento Grid", label: global.bentoGridTitle || s.label };
            if (s.id === 'projects' && s.label === 'Projets') return { ...s, label: 'Postes' };
            return s;
          });
          if (!hasComments) {
            migratedSections.push({ id: 'comments', label: 'Commentaires', subLabel: 'Vos Retours', visible: true });
          }
          setSectionsConfig(migratedSections);
        } else {
          setSectionsConfig([
            { id: 'projects', label: 'Postes', subLabel: 'Sélection 2024', visible: true },
            { id: 'shop', label: 'Boutique', subLabel: 'Nos Produits', visible: true },
            { id: 'gallery', label: 'Galerie', subLabel: 'Galerie Photo/Vidéo', visible: true },
            { id: 'comments', label: 'Commentaires', subLabel: 'Vos Retours', visible: true },
            { id: 'bento', label: 'À propos', subLabel: 'Bento Grid', visible: true }
          ]);
        }
      }
      const soc = sData.find(s => s.key === 'socials')?.value;
      if (soc) setSocials({ ...soc, customLinks: soc.customLinks || [] });
    }
    
    if (pData) setProjects(pData);
    if (prodData) setProducts(prodData);

    const { data: mData } = await supabase.from('media').select('*');
    if (mData) {
      const global = sData?.find(s => s.key === 'global')?.value;
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
      setMediaItems(mData);
    }
  };

  const moveItem = async (type: 'projects' | 'products' | 'media', index: number, direction: 'up' | 'down') => {
    const items = type === 'projects' ? [...projects] : type === 'products' ? [...products] : [...mediaItems];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    const itemsCopy = items as any[];
    const [removed] = itemsCopy.splice(index, 1);
    itemsCopy.splice(newIndex, 0, removed);
    if (type === 'projects') setProjects(itemsCopy as Project[]);
    else if (type === 'products') setProducts(itemsCopy as Product[]);
    else setMediaItems(itemsCopy as MediaItem[]);
    const orderKey = type === 'projects' ? 'projectOrder' : type === 'products' ? 'productOrder' : 'mediaOrder';
    const { data: globalData } = await supabase.from('settings').select('*').eq('key', 'global').single();
    const globalValue = globalData?.value || {};
    const { error } = await supabase.from('settings').upsert({
      key: 'global',
      value: { ...globalValue, [orderKey]: itemsCopy.map(i => i.id) }
    });
    if (error) console.error("Error saving order:", error);
  };

  const handleSaveSettings = async () => {
    const s = { profileName, profileProfession, profileBio, profileImage, heroTitleMain, heroTitleSub, textEffectImage, musicEnabled, musicUrl, musicCover, primaryColor, show3DBackground, musicRotationEnabled, statueTextureUrl, statueModelUrl, useOriginalMaterial, requireCommentValidation, sectionsConfig, mediaOrder: mediaItems.map(m => m.id) };
    const { error } = await supabase.from('settings').upsert({ key: 'global', value: s });
    if (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      setUploadSuccess(true); 
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  const handleSaveSocials = async () => {
    const { error } = await supabase.from('settings').upsert({ key: 'socials', value: socials });
    if (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement des réseaux : " + error.message);
    } else {
      setUploadSuccess(true); 
      setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  const handleReply = async (msgId: string) => {
    const text = replyText[msgId];
    const media = replyMedia[msgId] || [];
    if (!text && media.length === 0) return;
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const newReply = { text, date: new Date().toLocaleString("fr-FR"), from: "Lucas", media };
    const updatedReplies = [...(msg.replies || []), newReply];
    const { error } = await supabase.from('messages').update({ reply: text, replies: updatedReplies }).eq('id', msgId);
    if (!error) {
      setMessages(messages.map(m => m.id === msgId ? { ...m, reply: text, replies: updatedReplies } : m));
      setReplyText({ ...replyText, [msgId]: "" });
      setReplyMedia({ ...replyMedia, [msgId]: [] });
    }
  };

  const deleteProject = async (id: string) => { if (confirm("Supprimer?")) { await supabase.from('projects').delete().eq('id', id); setProjects(projects.filter(p => p.id !== id)); } };
  const deleteMedia = async (id: string) => { await supabase.from('media').delete().eq('id', id); setMediaItems(mediaItems.filter(m => m.id !== id)); };
  const deleteMessage = async (id: string) => { await supabase.from('messages').delete().eq('id', id); setMessages(messages.filter(m => m.id !== id)); };
  const deleteComment = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
    const { error } = await supabase.from('comments').delete().eq('id', id);
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== id));
    } else {
      alert("Erreur de suppression : " + error.message);
    }
  };
  const validateComment = async (id: string) => {
    const { error } = await supabase.from('comments').update({ validated: true }).eq('id', id);
    if (!error) {
      setComments(prev => prev.map(c => c.id === id ? { ...c, validated: true } : c));
    } else {
      alert("Erreur lors de la validation : " + error.message);
    }
  };

  const handleMfaEnroll = async () => {
    setMfaError("");
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors) {
        const unverified = factors.all.filter(f => f.status === 'unverified');
        for (const factor of unverified) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Lucas Portfolio', friendlyName: 'Admin Access' });
      if (error) {
        setMfaError(error.message);
        alert("Erreur A2F : " + error.message);
      } else {
        setMfaEnrollment(data);
      }
    } catch (err: any) {
      setMfaError(err.message);
    }
  };

  const handleMfaVerify = async () => {
    setMfaError("");
    const { data, error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaEnrollment.id, code: mfaCode });
    if (error) {
      setMfaError(error.message);
    } else {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      if (factors) setMfaFactors(factors.all.filter(f => f.status === 'verified'));
      setMfaEnrollment(null);
      setMfaCode("");
      alert("Double authentification activée !");
    }
  };

  const handleMfaUnenroll = async (factorId: string) => {
    if (confirm("Désactiver la double authentification ?")) {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (!error) {
        setMfaFactors(mfaFactors.filter(f => f.id !== factorId));
      }
    }
  };

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_auth');
    }
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    router.push("/admin/login");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const { data } = await supabase.from('media').insert({ url: reader.result as string, name: file.name }).select();
      if (data) setMediaItems([data[0], ...mediaItems]);
      setIsUploading(false); setUploadSuccess(true); setTimeout(() => setUploadSuccess(false), 3000);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalImages = prodImagesText.split('\n').map(img => img.trim()).filter(img => img !== "");
    const pData = { name: prodName, price: prodPrice, description: prodDesc, images: finalImages, link: prodLink, link_text: prodLinkText, purchase_message: prodPurchaseMsg };
    let error;
    if (editingProduct) {
      const { error: err } = await supabase.from('products').update(pData).eq('id', editingProduct.id);
      error = err;
    } else {
      const { data: newProd, error: err } = await supabase.from('products').insert(pData).select().single();
      error = err;
      if (newProd) {
        const { data: globalData } = await supabase.from('settings').select('*').eq('key', 'global').single();
        const globalValue = globalData?.value || {};
        const newOrder = [...(globalValue.productOrder || []), newProd.id];
        await supabase.from('settings').upsert({ key: 'global', value: { ...globalValue, productOrder: newOrder } });
      }
    }
    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      setIsProductModalOpen(false); fetchData(); setUploadSuccess(true); setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  const deleteProduct = async (id: string) => { if (confirm("Supprimer ce produit ?")) { await supabase.from('products').delete().eq('id', id); setProducts(products.filter(p => p.id !== id)); } };

  const addMediaByUrl = async () => {
    const url = prompt("URL Image ou Vidéo YouTube :");
    if (url) {
      const ytId = getYoutubeId(url);
      const name = ytId ? "Vidéo YouTube" : "URL Image";
      const { data } = await supabase.from('media').insert({ url, name }).select();
      if (data) setMediaItems([data[0], ...mediaItems]);
    }
  };

  const addGalleryItem = (type: 'image' | 'video') => {
    const url = prompt(type === 'video' ? "Lien YouTube :" : "URL Image :");
    if (url) {
      setFormGallery([...formGallery, { url, type }]);
    }
  };

  const removeGalleryItem = (idx: number) => { setFormGallery(formGallery.filter((_, i) => i !== idx)); };

  const moveGalleryItem = (idx: number, direction: 'up' | 'down') => {
    const newGallery = [...formGallery];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newGallery.length) return;
    [newGallery[idx], newGallery[targetIdx]] = [newGallery[targetIdx], newGallery[idx]];
    setFormGallery(newGallery);
  };

  const moveSection = (idx: number, direction: 'up' | 'down') => {
    const newSections = [...sectionsConfig];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;
    [newSections[idx], newSections[targetIdx]] = [newSections[targetIdx], newSections[idx]];
    setSectionsConfig(newSections);
  };

  const moveMediaItem = async (idx: number, direction: 'left' | 'right') => {
    const newMedia = [...mediaItems];
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newMedia.length) return;
    [newMedia[idx], newMedia[targetIdx]] = [newMedia[targetIdx], newMedia[idx]];
    setMediaItems(newMedia);
    const { data: sData } = await supabase.from('settings').select('*').eq('key', 'global').single();
    if (sData) {
      const newValue = { ...sData.value, mediaOrder: newMedia.map(m => m.id) };
      await supabase.from('settings').upsert({ key: 'global', value: newValue });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const projectData: any = { 
      title: formTitle, 
      category: formCategory || null, 
      date: formDate, 
      image: formImage, 
      status: formStatus, 
      link_type: formLinkType, 
      url: formUrl, 
      content: formContent,
      details: formDetails || null 
    };
    if (formGallery && formGallery.length > 0) { projectData.gallery = formGallery; }
    let error;
    if (editingProject) {
      const { error: err } = await supabase.from('projects').update(projectData).eq('id', editingProject.id);
      error = err;
    } else {
      const { data: newProj, error: err } = await supabase.from('projects').insert(projectData).select().single();
      error = err;
      if (newProj) {
        const { data: globalData } = await supabase.from('settings').select('*').eq('key', 'global').single();
        const globalValue = globalData?.value || {};
        const newOrder = [...(globalValue.projectOrder || []), newProj.id];
        await supabase.from('settings').upsert({ key: 'global', value: { ...globalValue, projectOrder: newOrder } });
      }
    }
    if (error) {
      alert("Erreur lors de l'enregistrement : " + error.message);
    } else {
      setIsModalOpen(false); fetchData(); setUploadSuccess(true); setTimeout(() => setUploadSuccess(false), 3000);
    }
  };

  const tabs = [
    { id: "stats", label: "Dashboard", icon: Activity },
    { id: "pages", label: "Postes", icon: FileText },
    { id: "media", label: "Médias", icon: ImageIcon },
    { id: "shop", label: "Boutique", icon: Zap },
    { id: "orders", label: "Commandes", icon: ShoppingCart },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "comments", label: "Commentaires", icon: Heart },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "social", label: "Social", icon: Share2 },
    { id: "settings", label: "Réglages", icon: Settings },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col md:flex-row"
    >
      <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-white/10 p-8 flex flex-col justify-between bg-white/5 backdrop-blur-xl">
        <div>
          <Link href="/" className="inline-block mb-12 group">
            <motion.h1 className="font-serif text-3xl tracking-tighter text-primary-green group-hover:scale-105 transition-transform">
              PELOILLE
              <span className="block text-xs font-sans tracking-[0.2em] text-white/40 mt-1 uppercase">Console Admin</span>
            </motion.h1>
          </Link>
          <nav className="space-y-3">
            {tabs.map((tab) => {
               const Icon = tab.icon;
               return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id ? "bg-primary-green text-white shadow-2xl shadow-primary-green/20 translate-x-2" : "text-white/60 hover:bg-white/5 hover:text-white hover:translate-x-1"}`}>
                  <Icon size={20} strokeWidth={1.5} />
                  <span className="font-medium tracking-wide flex-1 text-left">{tab.label}</span>
                  {tab.id === "messages" && messages.filter(m => !m.order_id).length > 0 && <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">{messages.filter(m => !m.order_id).length}</span>}
                  {tab.id === "orders" && messages.filter(m => m.order_id).length > 0 && <span className="bg-primary-green text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold shadow-lg shadow-primary-green/20">{messages.filter(m => m.order_id).length}</span>}
                  {tab.id === "comments" && comments.length > 0 && <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">{comments.length}</span>}
                </button>
              );
            })}
          </nav>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 text-white/30 hover:text-primary-green transition-all p-4">
          <LogOut size={20} /> <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-16 overflow-y-auto relative bg-[#0a0a0a]">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
          <h2 className="font-serif text-5xl text-white italic">{tabs.find((t) => t.id === activeTab)?.label}</h2>
          {activeTab === "pages" && (
            <button onClick={() => {
              setEditingProject(null);
              setFormTitle("");
              setFormCategory("");
              // Set publication date automatically
              const now = new Date();
              const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              setFormDate(formattedDate);
              setFormImage("");
              setFormContent("");
              setFormDetails("");
              setFormGallery([]);
              setIsModalOpen(true);
            }} className="bg-primary-green text-white px-8 py-3.5 rounded-2xl hover:bg-red-600 transition-all flex items-center gap-2 text-sm font-bold shadow-2xl shadow-primary-green/30">
              <Plus size={18} /> NOUVEAU POSTE
            </button>
          )}
          {activeTab === "shop" && (
            <button onClick={() => { setEditingProduct(null); setProdName(""); setProdPrice(0); setProdDesc(""); setProdImages([]); setProdImagesText(""); setProdLink(""); setProdLinkText(""); setProdPurchaseMsg(""); setIsProductModalOpen(true); }} className="bg-primary-green text-white px-8 py-3.5 rounded-2xl hover:bg-red-600 transition-all flex items-center gap-2 text-sm font-bold shadow-2xl shadow-primary-green/30">
              <Plus size={18} /> NOUVEAU PRODUIT
            </button>
          )}
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "stats" && (() => {
            // Count actual visits per day of the week (0 = Sunday, 1 = Monday...)
            const days = [0, 0, 0, 0, 0, 0, 0];
            visits.forEach(v => {
              if (v.visited_at) {
                const d = new Date(v.visited_at).getDay();
                days[d]++;
              }
            });
            const visitsByDay = [
              { day: "Lun", val: days[1] },
              { day: "Mar", val: days[2] },
              { day: "Mer", val: days[3] },
              { day: "Jeu", val: days[4] },
              { day: "Ven", val: days[5] },
              { day: "Sam", val: days[6] },
              { day: "Dim", val: days[0] }
            ];

            const maxVisits = Math.max(...visitsByDay.map(d => d.val), 5);
            // Dynamic SVG path calculations
            const chartPoints = visitsByDay.map((d, idx) => {
              const x = idx * 16.6; // Scale evenly from 0 to 100
              const y = 90 - ((d.val / maxVisits) * 75);
              return { x, y };
            });

            // Fallback nice baseline values for 0 traffic to keep design stunning
            const isZeroTraffic = visits.length === 0;
            const finalPoints = isZeroTraffic
              ? [
                  { x: 0, y: 90 },
                  { x: 16.6, y: 88 },
                  { x: 33.2, y: 90 },
                  { x: 49.8, y: 87 },
                  { x: 66.4, y: 89 },
                  { x: 83.0, y: 90 },
                  { x: 100, y: 88 }
                ]
              : chartPoints;

            // Generate paths
            const linePath = finalPoints.reduce((acc, p, idx) => {
              return acc + (idx === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`);
            }, "");
            const areaPath = `${linePath} L 100 95 L 0 95 Z`;

            return (
              <motion.div 
                key="stats" 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -15 }} 
                className="space-y-12"
              >
                {/* Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                  {[
                    { label: "Postes", value: projects.length, color: "from-red-500/20 to-red-600/5", icon: FileText, desc: "Articles & projets" },
                    { label: "Visites", value: visits.length, color: "from-emerald-500/20 to-emerald-600/5", icon: Activity, desc: "Vues uniques de l'IP" },
                    { label: "Boutique", value: products.length, color: "from-purple-500/20 to-purple-600/5", icon: Zap, desc: "Produits en vente" },
                    { label: "Messages", value: messages.length, color: "from-blue-500/20 to-blue-600/5", icon: MessageSquare, desc: "Contacts & formulaires" },
                    { label: "Communauté", value: allProfiles.length, color: "from-green-500/20 to-green-600/5", icon: Users, desc: "Membres enregistrés" },
                  ].map((card, i) => {
                    const Icon = card.icon;
                    return (
                      <div key={i} className="bg-black/35 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl relative overflow-hidden group shadow-2xl flex flex-col justify-between min-h-[140px] hover:border-primary-green/30 transition-all">
                        <div className={`absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br ${card.color} rounded-full opacity-30 group-hover:scale-125 transition-transform`} />
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">{card.label}</span>
                          <Icon size={18} className="text-white/30" />
                        </div>
                        <div>
                          <h4 className="font-serif text-4xl font-bold text-white mt-4">{card.value}</h4>
                          <p className="text-[9px] text-white/30 mt-1 uppercase tracking-wider">{card.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Main analytics row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Visual SVG Activity Chart */}
                  <div className="lg:col-span-8 bg-black/25 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col justify-between min-h-[400px]">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-green">Analyses</span>
                        <h3 className="font-serif text-2xl text-white italic mt-1">Activité Récente</h3>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full text-white/70">7 derniers jours</span>
                    </div>

                    {/* SVG Chart */}
                    <div className="relative flex-1 min-h-[220px] flex items-end justify-between px-2 pt-6">
                      {/* SVG Graph path drawing */}
                      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary-green)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--primary-green)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area path */}
                        <path
                          d={areaPath}
                          fill="url(#chartGrad)"
                          className="transition-all duration-1000"
                        />
                        {/* Line path */}
                        <path
                          d={linePath}
                          fill="none"
                          stroke="var(--primary-green)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          className="transition-all duration-1000"
                        />
                      </svg>

                      {/* Chart axis markers */}
                      <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-[8px] font-bold text-white/20 uppercase tracking-widest pointer-events-none pb-8">
                        <span>{isZeroTraffic ? "5" : maxVisits}</span>
                        <span>{isZeroTraffic ? "2" : Math.round(maxVisits / 2)}</span>
                        <span>0</span>
                      </div>

                      {/* Chart columns with interactive bars */}
                      {visitsByDay.map((col, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 group relative z-10 w-full">
                          <div className="text-[9px] font-bold bg-white/10 text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 shadow-xl">
                            {col.val} visites
                          </div>
                          <div 
                            style={{ height: `${maxVisits > 0 ? (col.val / maxVisits) * 160 : 0}px` }} 
                            className="w-1.5 md:w-2 bg-white/10 group-hover:bg-primary-green rounded-full transition-all duration-500 relative min-h-[4px]"
                          >
                            <div className="absolute inset-0 bg-primary-green rounded-full scale-0 group-hover:scale-100 transition-transform origin-bottom" />
                          </div>
                          <span className="text-[9px] font-bold text-white/40 uppercase tracking-wider">{col.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Connection History Sidebar */}
                  <div className="lg:col-span-4 bg-black/25 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col justify-between min-h-[400px]">
                    <div className="mb-6">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-green">Sécurité</span>
                      <h3 className="font-serif text-2xl text-white italic mt-1">Logs de Connexion</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[280px] space-y-4 no-scrollbar">
                      {visits.length === 0 ? (
                        <p className="text-center py-20 text-white/30 italic text-xs">Aucune visite récente.</p>
                      ) : (
                        visits.slice(0, 5).map((log, i) => (
                          <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3.5 shadow-md">
                            <div className="p-2.5 bg-primary-green/10 border border-primary-green/20 rounded-xl text-primary-green shrink-0">
                              <Clock size={14} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-xs text-white truncate">{log.ip}</span>
                                <span className="text-[8px] text-white/30 font-bold uppercase tracking-widest">{new Date(log.visited_at).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-[9px] text-white/40 mt-1">{new Date(log.visited_at).toLocaleDateString("fr-FR")}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })()}

          {activeTab === "pages" && (
            <motion.div key="pages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {projects.map((project, idx) => (
                <div key={project.id} className="flex items-center gap-6 px-8 py-6 bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-black/30 transition-all group shadow-xl">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moveItem('projects', idx, 'up')} className="opacity-30 hover:opacity-100 text-white"><ArrowLeft size={14} className="rotate-90" /></button>
                    <button onClick={() => moveItem('projects', idx, 'down')} className="opacity-30 hover:opacity-100 text-white"><ArrowLeft size={14} className="-rotate-90" /></button>
                  </div>
                  <div className="flex-1 flex items-center gap-6">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-lg border border-white/10"><Image src={project.image} alt={project.title} fill className="object-cover" unoptimized /></div>
                    <div className="flex flex-col">
                      <span className="font-serif text-xl text-white">{project.title}</span>
                      <span className="text-[9px] font-bold text-white/40 tracking-[0.2em] uppercase">{project.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      setEditingProject(project);
                      setFormTitle(project.title);
                      setFormCategory(project.category || "");
                      setFormDate(project.date || "");
                      setFormImage(project.image);
                      setFormStatus(project.status);
                      setFormLinkType(project.link_type);
                      setFormUrl(project.url || "");
                      setFormContent(project.content || "");
                      setFormDetails((project as any).details || "");
                      setFormGallery(project.gallery || []);
                      setIsModalOpen(true);
                    }} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-primary-green transition-all"><Edit2 size={18} /></button>
                    <button onClick={() => deleteProject(project.id)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/50 hover:text-red-500 transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === "media" && (
            <motion.div key="media" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-text-black/10 rounded-sm bg-white/20 hover:border-primary-green/30 transition-all cursor-pointer">
                  {isUploading ? <div className="animate-pulse text-primary-green font-bold">Envoi...</div> : (
                    <> <Upload className="mx-auto mb-2 text-primary-green" size={32} /> <p className="font-serif text-lg">Upload Local</p> <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} /> </>
                  )}
                </div>
                <button onClick={addMediaByUrl} className="flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-text-black/10 rounded-sm bg-white/20 hover:border-primary-green/30 transition-all"> <LinkIcon className="mx-auto mb-2 text-primary-green" size={32} /> <p className="font-serif text-lg">Ajouter par URL</p> </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {mediaItems.map((item) => {
                  const ytId = getYoutubeId(item.url);
                  const displayUrl = ytId ? getYoutubeThumbnail(ytId) : item.url;
                  return (
                    <div key={item.id} className="group relative aspect-square border border-text-black/5 rounded-sm overflow-hidden shadow-sm bg-text-black/5">
                      <Image src={displayUrl} alt={item.name} fill className="object-cover" unoptimized />
                      {ytId && <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><Zap size={20} className="text-white fill-current" /></div>}
                      <div className="absolute inset-0 bg-soft-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <div className="flex flex-col gap-1 mr-2">
                          <button onClick={() => moveMediaItem(mediaItems.indexOf(item), 'left')} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-sm text-white transition-colors"><ArrowLeft size={14} /></button>
                          <button onClick={() => moveMediaItem(mediaItems.indexOf(item), 'right')} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-sm text-white transition-colors"><ArrowLeft size={14} className="rotate-180" /></button>
                        </div>
                        <button onClick={() => deleteMedia(item.id)} className="p-2 bg-red-600 text-white rounded-sm"><Trash2 size={14} /></button>
                      </div>
                      {ytId && <div className="absolute bottom-2 left-2 bg-text-black/80 text-white text-[8px] px-1.5 py-0.5 rounded-xs uppercase tracking-widest font-bold">Vidéo</div>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "social" && (
            <motion.div key="social" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl space-y-8">
              <div className="bg-white/40 border border-text-black/5 rounded-sm p-8 space-y-10">
                <div className="space-y-6"> <h3 className="font-serif text-2xl border-b border-text-black/10 pb-4">Email</h3> <input type="email" value={socials.email} onChange={(e) => setSocials({...socials, email: e.target.value})} className="w-full bg-transparent border-b border-text-black/20 py-2 outline-none" /> </div>
                <div className="space-y-8">
                  <h3 className="font-serif text-2xl border-b border-text-black/10 pb-4">Réseaux</h3>
                  {[ { id: "linkedin", label: "LinkedIn", icon: FaLinkedin }, { id: "github", label: "GitHub", icon: FaGithub }, { id: "twitter", label: "Twitter (X)", icon: FaTwitter }, { id: "instagram", label: "Instagram", icon: FaInstagram }, { id: "youtube", label: "YouTube", icon: FaYoutube }, { id: "tiktok", label: "TikTok", icon: FaTiktok }, { id: "discord", label: "Discord", icon: FaDiscord }, { id: "phone", label: "Téléphone", icon: FaPhone } ].map((platform) => (
                    <div key={platform.id} className="flex items-center gap-8">
                      <div className="w-12 h-12 bg-text-black/5 rounded-sm flex items-center justify-center"><platform.icon size={20} /></div>
                      <div className="flex-1"> <label className="block text-[10px] font-bold uppercase tracking-widest mb-1 opacity-50">{platform.label}</label> <input type="text" value={(socials as any)[platform.id]?.url || ""} onChange={(e) => setSocials({...socials, [platform.id]: {...(socials as any)[platform.id], url: e.target.value}})} className="w-full bg-transparent border-b border-text-black/20 py-1 outline-none text-sm" /> </div>
                      <button onClick={() => setSocials({...socials, [platform.id]: {...(socials as any)[platform.id], enabled: !(socials as any)[platform.id]?.enabled}})} className={`w-12 h-6 rounded-full transition-colors relative ${ (socials as any)[platform.id]?.enabled ? "bg-primary-green" : "bg-text-black/10" }`}> <motion.div animate={{ x: (socials as any)[platform.id]?.enabled ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm" /> </button>
                    </div>
                  ))}
                </div>
                {/* Liens Personnalisés Section */}
                <div className="space-y-6 pt-6 border-t border-text-black/10">
                  <div className="flex justify-between items-center border-b border-text-black/10 pb-4">
                    <h3 className="font-serif text-2xl">Liens Personnalisés</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedLinks = [
                          ...(socials.customLinks || []),
                          { name: "Mon site", url: "https://", icon: "link", enabled: true }
                        ];
                        setSocials({ ...socials, customLinks: updatedLinks });
                      }}
                      className="bg-primary-green hover:bg-red-600 text-white font-bold text-[10px] tracking-widest uppercase px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <Plus size={12} /> Ajouter
                    </button>
                  </div>

                  {(socials.customLinks || []).length === 0 ? (
                    <p className="text-sm text-white/45 italic py-2">Aucun lien personnalisé configuré.</p>
                  ) : (
                    <div className="space-y-6">
                      {(socials.customLinks || []).map((link, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 shadow-md">
                          {/* Icon selection */}
                          <div className="flex flex-col w-full md:w-36">
                            <label className="block text-[8px] font-bold uppercase tracking-widest mb-1 opacity-50">Icône</label>
                            <select
                              value={link.icon || "link"}
                              onChange={(e) => {
                                const updated = [...(socials.customLinks || [])];
                                updated[idx] = { ...updated[idx], icon: e.target.value };
                                setSocials({ ...socials, customLinks: updated });
                              }}
                              className="bg-[#121212]/90 border border-white/10 text-white rounded-lg px-2 py-1.5 text-xs focus:border-primary-green outline-none mb-2"
                            >
                              {Object.keys(ICON_MAP).map((iconKey) => (
                                <option key={iconKey} value={iconKey} className="bg-[#121212] text-white">
                                  {iconKey.charAt(0).toUpperCase() + iconKey.slice(1)}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              value={link.customIconUrl || ""}
                              onChange={(e) => {
                                const updated = [...(socials.customLinks || [])];
                                updated[idx] = { ...updated[idx], customIconUrl: e.target.value };
                                setSocials({ ...socials, customLinks: updated });
                              }}
                              className="w-full bg-transparent border-b border-text-black/20 py-1 outline-none text-[10px]"
                              placeholder="Image URL (optionnel)"
                              title="URL d'une image (remplace l'icône)"
                            />
                          </div>

                          {/* Name input */}
                          <div className="flex-1 w-full">
                            <label className="block text-[8px] font-bold uppercase tracking-widest mb-1 opacity-50">Nom du lien</label>
                            <input
                              type="text"
                              value={link.name}
                              onChange={(e) => {
                                const updated = [...(socials.customLinks || [])];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setSocials({ ...socials, customLinks: updated });
                              }}
                              className="w-full bg-transparent border-b border-text-black/20 py-1 outline-none text-sm"
                              placeholder="Ex: Portfolio, Blog..."
                            />
                          </div>

                          {/* URL input */}
                          <div className="flex-1 w-full md:w-64">
                            <label className="block text-[8px] font-bold uppercase tracking-widest mb-1 opacity-50">URL</label>
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => {
                                const updated = [...(socials.customLinks || [])];
                                updated[idx] = { ...updated[idx], url: e.target.value };
                                setSocials({ ...socials, customLinks: updated });
                              }}
                              className="w-full bg-transparent border-b border-text-black/20 py-1 outline-none text-sm"
                              placeholder="https://..."
                            />
                          </div>

                          {/* Toggle & Delete buttons */}
                          <div className="flex items-center gap-4 self-end md:self-center mt-2 md:mt-0">
                            {/* Enable toggle */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(socials.customLinks || [])];
                                updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
                                setSocials({ ...socials, customLinks: updated });
                              }}
                              className={`w-10 h-5 rounded-full transition-colors relative shrink-0 ${
                                link.enabled ? "bg-primary-green" : "bg-text-black/10"
                              }`}
                            >
                              <motion.div
                                animate={{ x: link.enabled ? 20 : 2 }}
                                className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 shadow-sm"
                              />
                            </button>

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (socials.customLinks || []).filter((_, i) => i !== idx);
                                setSocials({ ...socials, customLinks: updated });
                              }}
                              className="p-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-500 rounded-xl transition-all"
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={handleSaveSocials} className="bg-text-black text-white px-10 py-4 font-bold text-xs tracking-widest uppercase">Sauvegarder</button>
              </div>
            </motion.div>
          )}

          {activeTab === "messages" && (
            <motion.div key="messages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              {messages.filter(m => !m.order_id).length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center text-white/40 italic">
                  Aucun message pour le moment.
                </div>
              ) : (
                messages.filter(m => !m.order_id).map((msg) => (
                  <div key={msg.id} className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-8 relative group shadow-2xl">
                    <button onClick={() => deleteMessage(msg.id)} className="absolute top-8 right-8 text-white/20 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-full bg-white/10 border border-white/10 overflow-hidden relative shrink-0">
                        {(msg as any).profiles?.avatar_url ? (
                          <Image src={(msg as any).profiles.avatar_url} alt="Profile" fill className="object-cover" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-green/10 text-primary-green">
                            <User size={24} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4 flex-wrap">
                          <h3 className="font-serif text-3xl text-white">{(msg as any).profiles?.full_name || msg.name || "Anonyme"}</h3>
                          <span className="text-white/40 text-xs">{(msg as any).profiles?.full_name ? `(${msg.name})` : ''}</span>
                          {msg.user_email && <span className="bg-blue-500/20 text-blue-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border border-blue-500/20 flex items-center gap-2"><User size={12} /> {msg.user_email}</span>}
                          {(msg as any).contact && <span className="bg-green-500/20 text-green-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-500/20 flex items-center gap-2"><Phone size={12} /> {(msg as any).contact}</span>}
                        </div>
                        <h4 className="text-xl font-medium text-white/90">{msg.title}</h4>
                        <p className="text-base leading-relaxed text-white/70 bg-white/5 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap">{msg.content}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="flex flex-wrap gap-3 pt-2">
                            {msg.attachments.map((att, aidx) => (
                              <a key={aidx} href={att} target="_blank" rel="noreferrer" className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 group cursor-pointer block shadow-lg">
                                <Image src={att} alt="Attachment" fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <ExternalLink size={20} className="text-white drop-shadow-md" />
                                </div>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      {msg.replies && msg.replies.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                          {msg.replies.map((rep, ridx) => (
                            <div key={ridx} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-40">
                                <span>Lucas</span>
                                <span>{rep.date}</span>
                              </div>
                              <p className="text-sm text-white/80">{rep.text}</p>
                              {rep.media && rep.media.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                  {rep.media.map((m, midx) => (
                                    <div key={midx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                                      <Image src={m.url} alt="Reply Media" fill className="object-cover" unoptimized />
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex flex-col gap-3">
                        {replyMedia[msg.id]?.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
                            {replyMedia[msg.id].map((m, idx) => (
                              <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                                <Image src={m.url} alt="Pending Media" fill className="object-cover" unoptimized />
                                <button onClick={() => setReplyMedia({ ...replyMedia, [msg.id]: replyMedia[msg.id].filter((_, i) => i !== idx) })} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-4 items-end">
                          <div className="flex-1 relative">
                            <textarea 
                              placeholder="Votre réponse..." 
                              value={replyText[msg.id] || ""} 
                              onChange={(e) => setReplyText({ ...replyText, [msg.id]: e.target.value })} 
                              rows={2} 
                              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white outline-none focus:border-primary-green transition-all resize-none" 
                            />
                            <button 
                              onClick={() => {
                                const url = prompt("URL de l'image :");
                                if (url) {
                                  const current = replyMedia[msg.id] || [];
                                  setReplyMedia({ ...replyMedia, [msg.id]: [...current, { url, type: 'image' }] });
                                }
                              }}
                              className="absolute right-4 bottom-4 text-white/30 hover:text-primary-green transition-colors"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                          <button onClick={() => handleReply(msg.id)} className="bg-primary-green text-white px-8 py-4 text-xs font-bold rounded-2xl flex items-center gap-2 hover:bg-red-600 transition-all shadow-xl shadow-primary-green/20 h-[52px]"> <Send size={16} /> RÉPONDRE </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "orders" && (() => {
            const orderMessages = messages.filter(m => m.order_id);
            const filteredOrders = orderMessages.filter(o => {
              const query = orderSearchQuery.toLowerCase();
              return (
                o.order_id?.toLowerCase().includes(query) ||
                o.name?.toLowerCase().includes(query) ||
                o.title?.toLowerCase().includes(query) ||
                o.content?.toLowerCase().includes(query) ||
                o.user_email?.toLowerCase().includes(query) ||
                o.contact?.toLowerCase().includes(query)
              );
            });

            const totalOrders = orderMessages.length;
            
            const getOrderPrice = (msg: Message) => {
              const product = products.find(p => msg.title.toLowerCase().includes(p.name.toLowerCase()));
              if (product) return product.price;
              const match = msg.content.match(/(\d+)\s*€/);
              return match ? parseInt(match[1]) : 0;
            };

            const totalRevenue = orderMessages.reduce((sum, msg) => sum + getOrderPrice(msg), 0);
            
            return (
              <motion.div 
                key="orders" 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }} 
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-black/35 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl relative overflow-hidden group shadow-2xl flex flex-col justify-between hover:border-primary-green/30 transition-all">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-red-500/20 to-red-600/5 rounded-full opacity-30 group-hover:scale-125 transition-transform" />
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Total Commandes</span>
                      <ShoppingCart size={18} className="text-white/30" />
                    </div>
                    <div>
                      <h4 className="font-serif text-4xl font-bold text-white mt-4">{totalOrders}</h4>
                      <p className="text-[9px] text-white/30 mt-1 uppercase tracking-wider">Demandes d'achat uniques</p>
                    </div>
                  </div>

                  <div className="bg-black/35 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl relative overflow-hidden group shadow-2xl flex flex-col justify-between hover:border-primary-green/30 transition-all">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 rounded-full opacity-30 group-hover:scale-125 transition-transform" />
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Chiffre Estimé</span>
                      <Zap size={18} className="text-white/30" />
                    </div>
                    <div>
                      <h4 className="font-serif text-4xl font-bold text-emerald-400 mt-4">{totalRevenue} €</h4>
                      <p className="text-[9px] text-white/30 mt-1 uppercase tracking-wider">Cumulé sur les produits boutique</p>
                    </div>
                  </div>

                  <div className="bg-black/35 backdrop-blur-2xl border border-white/10 p-6 rounded-3xl relative overflow-hidden group shadow-2xl flex flex-col justify-between hover:border-primary-green/30 transition-all">
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-gradient-to-br from-blue-500/20 to-blue-600/5 rounded-full opacity-30 group-hover:scale-125 transition-transform" />
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Engagement Cash</span>
                      <Check size={18} className="text-white/30" />
                    </div>
                    <div>
                      <h4 className="font-serif text-4xl font-bold text-blue-400 mt-4">
                        {orderMessages.filter(m => m.agreed_to_pay).length}
                      </h4>
                      <p className="text-[9px] text-white/30 mt-1 uppercase tracking-wider">Clients engagés à payer cash</p>
                    </div>
                  </div>
                </div>

                <div className="flex bg-white/5 border border-white/10 p-2 rounded-2xl shadow-lg items-center gap-4">
                  <input
                    type="text"
                    placeholder="Rechercher par ID, produit, client, email..."
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent py-2 px-4 outline-none text-white placeholder-white/35 text-sm"
                  />
                  {orderSearchQuery && (
                    <button onClick={() => setOrderSearchQuery("")} className="text-white/40 hover:text-white transition-colors px-2">
                      <X size={16} />
                    </button>
                  )}
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center text-white/40 italic">
                    {orderMessages.length === 0 ? "Aucune commande reçue pour le moment." : "Aucune commande ne correspond à votre recherche."}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {filteredOrders.map((msg) => {
                      const orderPrice = getOrderPrice(msg);
                      const isAgreed = msg.agreed_to_pay;

                      return (
                        <div key={msg.id} className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-8 relative group shadow-2xl hover:border-primary-green/20 transition-all">
                          <button onClick={() => deleteMessage(msg.id)} className="absolute top-8 right-8 text-white/20 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                          
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
                            <div className="flex items-center gap-4 flex-wrap">
                              <span className="bg-primary-green text-white font-mono text-sm font-bold tracking-widest px-4 py-1.5 rounded-xl shadow-lg shadow-primary-green/10 border border-primary-green/10">
                                #{msg.order_id}
                              </span>
                              <span className="text-white/40 text-xs">{msg.date}</span>
                              {isAgreed ? (
                                <span className="bg-green-500/10 text-green-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border border-green-500/20 flex items-center gap-1.5 shadow-md">
                                  <Check size={12} /> Paiement Cash Confirmé
                                </span>
                              ) : (
                                <span className="bg-amber-500/10 text-amber-400 px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full border border-amber-500/20 flex items-center gap-1.5 shadow-md">
                                  <AlertCircle size={12} /> Engagement Non Validé
                                </span>
                              )}
                            </div>
                            
                            {orderPrice > 0 && (
                              <div className="text-right">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40 block">Montant Estimé</span>
                                <span className="text-2xl font-serif italic text-emerald-400 mt-1 block">{orderPrice} €</span>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-4 bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-green">Client</h4>
                              
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 overflow-hidden relative shrink-0 flex items-center justify-center">
                                  {(msg as any).profiles?.avatar_url ? (
                                    <Image src={(msg as any).profiles.avatar_url} alt="Profile" fill className="object-cover" unoptimized />
                                  ) : (
                                    <User size={20} className="text-white/40" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-serif text-lg text-white truncate block">{(msg as any).profiles?.full_name || msg.name || "Anonyme"}</span>
                                  <span className="text-[9px] text-white/40 uppercase tracking-widest block">{(msg as any).profiles?.full_name ? msg.name : "Visiteur"}</span>
                                </div>
                              </div>

                              <div className="space-y-2 pt-2 border-t border-white/5 text-xs text-white/70">
                                <div className="flex justify-between">
                                  <span className="text-white/40">Email :</span>
                                  <span className="font-medium truncate max-w-[180px]">{msg.user_email || "Non renseigné"}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-white/40">Contact :</span>
                                  <span className="font-medium truncate max-w-[180px]">{(msg as any).contact || "Non renseigné"}</span>
                                </div>
                              </div>
                            </div>

                            <div className="lg:col-span-8 space-y-4">
                              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">Détails de la demande</h4>
                              <h3 className="text-xl font-medium text-white/90">{msg.title}</h3>
                              <p className="text-sm leading-relaxed text-white/70 bg-white/5 p-6 rounded-2xl border border-white/5 whitespace-pre-wrap">{msg.content}</p>
                              
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-white/35">Pièces jointes ({msg.attachments.length})</span>
                                  <div className="flex flex-wrap gap-3">
                                    {msg.attachments.map((att, aidx) => (
                                      <a key={aidx} href={att} target="_blank" rel="noreferrer" className="relative w-24 h-24 rounded-xl overflow-hidden border border-white/10 group cursor-pointer block shadow-lg">
                                        <Image src={att} alt="Attachment" fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <ExternalLink size={20} className="text-white drop-shadow-md" />
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-4 pt-6 border-t border-white/5">
                            {msg.replies && msg.replies.length > 0 && (
                              <div className="space-y-4">
                                {msg.replies.map((rep, ridx) => (
                                  <div key={ridx} className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest opacity-40">
                                      <span>Lucas (Admin)</span>
                                      <span>{rep.date}</span>
                                    </div>
                                    <p className="text-sm text-white/80">{rep.text}</p>
                                    {rep.media && rep.media.length > 0 && (
                                      <div className="flex flex-wrap gap-2 pt-2">
                                        {rep.media.map((m, midx) => (
                                          <div key={midx} className="relative w-20 h-20 rounded-lg overflow-hidden border border-white/10">
                                            <Image src={m.url} alt="Reply Media" fill className="object-cover" unoptimized />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="flex flex-col gap-3">
                              {replyMedia[msg.id]?.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-xl border border-white/10">
                                  {replyMedia[msg.id].map((m, idx) => (
                                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden group">
                                      <Image src={m.url} alt="Pending Media" fill className="object-cover" unoptimized />
                                      <button onClick={() => setReplyMedia({ ...replyMedia, [msg.id]: replyMedia[msg.id].filter((_, i) => i !== idx) })} className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-4 items-end">
                                <div className="flex-1 relative">
                                  <textarea 
                                    placeholder="Répondre au client..." 
                                    value={replyText[msg.id] || ""} 
                                    onChange={(e) => setReplyText({ ...replyText, [msg.id]: e.target.value })} 
                                    rows={2} 
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pr-12 text-sm text-white outline-none focus:border-primary-green transition-all resize-none" 
                                  />
                                  <button 
                                    onClick={() => {
                                      const url = prompt("URL de l'image :");
                                      if (url) {
                                        const current = replyMedia[msg.id] || [];
                                        setReplyMedia({ ...replyMedia, [msg.id]: [...current, { url, type: 'image' }] });
                                      }
                                    }}
                                    className="absolute right-4 bottom-4 text-white/30 hover:text-primary-green transition-colors"
                                  >
                                    <Plus size={20} />
                                  </button>
                                </div>
                                <button onClick={() => handleReply(msg.id)} className="bg-primary-green text-white px-8 py-4 text-xs font-bold rounded-2xl flex items-center gap-2 hover:bg-red-600 transition-all shadow-xl shadow-primary-green/20 h-[52px]"> <Send size={16} /> RÉPONDRE </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })()}

          {activeTab === "comments" && (
            <motion.div key="comments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="bg-white/5 border border-white/10 p-4 rounded-2xl mb-6 shadow-lg flex justify-between items-center bg-white/5 backdrop-blur-xl">
                <h3 className="text-white font-serif text-xl">Modération des Commentaires ({comments.length})</h3>
                <span className="text-[10px] font-bold uppercase bg-primary-green/10 text-primary-green px-3 py-1 rounded-full border border-primary-green/20">Console Direct</span>
              </div>

              {comments.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-12 text-center text-white/40 italic">
                  Aucun commentaire publié pour le moment.
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment) => {
                    const isParent = !comment.parent_id;
                    const dateFormatted = new Date(comment.created_at).toLocaleString("fr-FR");
                    const commentLikesCount = (comment.likes || []).length;

                    return (
                      <div key={comment.id} className={`bg-black/20 backdrop-blur-xl border ${comment.deleted_by_user ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-white/10'} rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative group transition-all`}>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 overflow-hidden relative shrink-0 flex items-center justify-center">
                            {comment.avatar_url ? (
                              <Image src={comment.avatar_url} alt="Avatar" fill className="object-cover" unoptimized />
                            ) : (
                              <User size={20} className="text-white/40" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                              <h4 className="text-lg font-bold text-white leading-none">{comment.user_name}</h4>
                              <span className="text-xs text-white/30">{dateFormatted}</span>
                              {!isParent && (
                                <span className="bg-white/10 text-white/50 text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                                  Réponse
                                </span>
                              )}
                              {comment.user_email === 'caillatlucas2304@gmail.com' && (
                                <span className="bg-primary-green/20 text-primary-green text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-primary-green/20">
                                  Admin
                                </span>
                              )}
                              {comment.deleted_by_user && (
                                <span className="bg-red-500/20 text-red-400 text-[8px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-red-500/20 shadow-md">
                                  Supprimé par l'utilisateur
                                </span>
                              )}
                            </div>
                            
                            {comment.content && comment.content.trim() && (
                              <p className="text-base text-white/80 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
                            )}
                            
                            {comment.image_url && (
                              <div className="relative max-w-xs aspect-video rounded-xl overflow-hidden border border-white/10 mt-3 shadow-md">
                                <Image src={comment.image_url} alt="Media" fill className="object-cover" unoptimized />
                              </div>
                            )}

                            {!comment.validated && (
                              <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">En attente de validation</span>
                                <button 
                                  onClick={() => validateComment(comment.id)} 
                                  className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-white"
                                >
                                  <Check size={12} /> Valider
                                </button>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-4">
                              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/40">
                                <span className="flex items-center gap-1.5"><Heart size={12} className="text-primary-green fill-primary-green animate-pulse" /> {commentLikesCount} likes</span>
                                {comment.user_email && <span className="text-white/30 lowercase font-normal">{comment.user_email}</span>}
                              </div>
                              <button 
                                onClick={() => deleteComment(comment.id)} 
                                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 shadow-lg border ${
                                  comment.deleted_by_user 
                                    ? "bg-red-600 text-white hover:bg-red-700 border-red-600/20" 
                                    : "bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border-red-500/20"
                                }`}
                                title="Supprimer définitivement de la base de données (Archiver)"
                              >
                                <Trash2 size={12} /> {comment.deleted_by_user ? "Archiver définitivement" : "Archiver (Supprimer def)"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "users" && (() => {
            // Création dynamique des fiches "Guest" à partir des messages sans user_id
            const guestMap = new Map();
            messages.filter(m => !m.user_id && (m.contact || m.name)).forEach(m => {
               const key = m.contact || m.name;
               if (!guestMap.has(key)) {
                  guestMap.set(key, {
                     id: `guest-${key}`,
                     full_name: `${m.name || 'Anonyme'} (Guest)`,
                     avatar_url: null,
                     is_guest: true,
                     contact: m.contact
                  });
               }
            });
            const guestProfiles = Array.from(guestMap.values());
            const displayProfiles = [...allProfiles, ...guestProfiles];

            return (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex justify-between items-center bg-white/5 border border-white/10 p-4 rounded-2xl mb-6 shadow-lg">
                  <h3 className="text-white font-serif text-xl">Communauté ({displayProfiles.length})</h3>
                  <button onClick={fetchGlobalIps} className="bg-primary-green/10 text-primary-green border border-primary-green/20 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary-green/20 transition-all flex items-center gap-2 shadow-lg shadow-primary-green/5">
                    Logs Globaux IP
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProfiles.map((profile) => {
                    const userMessages = profile.is_guest 
                      ? messages.filter(m => !m.user_id && (m.contact || m.name) === profile.id.replace('guest-', ''))
                      : messages.filter(m => m.user_id === profile.id);
                    
                    const userComments = profile.is_guest
                      ? []
                      : comments.filter(c => c.user_id === profile.id);
                    
                    return (
                      <div key={profile.id} className={`bg-black/20 backdrop-blur-xl border ${profile.is_guest ? 'border-dashed border-white/20' : 'border-white/10'} rounded-3xl p-6 flex flex-col justify-between group hover:bg-black/30 transition-all shadow-xl relative overflow-hidden min-h-[220px]`}>
                        {profile.is_guest && <div className="absolute -right-4 -top-4 w-12 h-12 bg-white/5 rotate-45" />}
                        
                        <div className="flex items-center gap-4 w-full">
                          <div className={`w-14 h-14 rounded-full ${profile.is_guest ? 'bg-white/5' : 'bg-white/10'} border border-white/20 overflow-hidden relative shrink-0`}>
                            {profile.avatar_url ? (
                              <Image src={profile.avatar_url} alt="Avatar" fill className="object-cover" unoptimized />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20">
                                <User size={28} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-bold text-white truncate flex items-center gap-1.5">
                              {profile.full_name} 
                              {profile.is_guest && <span className="text-[7px] bg-white/10 px-1.5 py-0.5 rounded text-white/50 uppercase tracking-widest font-sans">Invité</span>}
                            </h4>
                            <p className="text-[9px] text-white/40 uppercase tracking-widest mt-0.5 truncate">
                              {profile.is_guest ? `Contact: ${profile.contact || 'Inconnu'}` : `ID: ${profile.id.substring(0, 8)}...`}
                            </p>
                          </div>
                        </div>

                        {/* Stats badges */}
                        <div className="flex flex-wrap items-center gap-2 mt-4">
                          <span className="text-[9px] font-bold bg-primary-green/10 text-primary-green px-2.5 py-1 rounded-full border border-primary-green/20 shadow-md">
                            {userMessages.length} msg{userMessages.length > 1 ? 's' : ''}
                          </span>
                          {!profile.is_guest && (
                            <span className="text-[9px] font-bold bg-green-500/10 text-green-400 px-2.5 py-1 rounded-full border border-green-500/20 shadow-md">
                              {userComments.length} com{userComments.length > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Administration actions footer buttons */}
                        <div className="flex items-center gap-2 mt-5 pt-3 border-t border-white/5 w-full">
                          <button
                            onClick={() => {
                              setSelectedUserHistory({
                                profile,
                                messages: userMessages,
                                comments: userComments
                              });
                            }}
                            className="text-[9px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-primary-green hover:text-white transition-all text-white/70 px-3.5 py-2 rounded-xl flex-1 text-center shadow-lg animate-pulse hover:animate-none"
                          >
                            Historique
                          </button>
                          {!profile.is_guest && (
                            <button 
                              onClick={() => fetchIpHistory(profile.id)}
                              className="text-[9px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 px-3.5 py-2 rounded-xl border border-blue-500/20 hover:bg-blue-500/20 transition-colors shadow-lg"
                              title="Historique de connexion IP"
                            >
                              IP
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}

          {activeTab === "shop" && (
            <motion.div key="shop" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {products.length === 0 ? <p className="text-center py-20 text-white/30 italic">Aucun produit en vente.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {products.map((product, idx) => (
                    <div key={product.id} className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden group shadow-2xl transition-all hover:bg-black/30">
                      <div className="relative aspect-square">
                        <Image src={product.images[0] || ""} alt={product.name} fill className="object-cover" unoptimized />
                        <div className="absolute top-4 right-4 bg-primary-green text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">{product.price}€</div>
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                          <button onClick={() => moveItem('products', idx, 'up')} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all"><ArrowLeft size={14} className="rotate-90" /></button>
                          <button onClick={() => moveItem('products', idx, 'down')} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all"><ArrowLeft size={14} className="-rotate-90" /></button>
                        </div>
                      </div>
                      <div className="p-6 space-y-6">
                        <h3 className="font-serif text-2xl text-white">{product.name}</h3>
                        <div className="flex justify-between items-center pt-6 border-t border-white/10">
                          <button onClick={() => { setEditingProduct(product); setProdName(product.name); setProdPrice(product.price); setProdDesc(product.description); setProdImages(product.images); setProdImagesText(product.images.join('\n')); setProdLink(product.link || ""); setProdLinkText(product.link_text || ""); setProdPurchaseMsg(product.purchase_message || ""); setIsProductModalOpen(true); }} className="text-[10px] font-bold uppercase tracking-widest text-white/60 hover:text-primary-green transition-colors flex items-center gap-2"><Edit2 size={14} /> Modifier</button>
                          <button onClick={() => deleteProduct(product.id)} className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors flex items-center gap-2"><Trash2 size={14} /> Supprimer</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-3xl space-y-8">
              <div className="bg-white/40 border border-text-black/5 rounded-sm p-8 space-y-8">
                <h3 className="font-serif text-2xl border-b border-text-black/10 pb-4">Musique & Hero</h3>
                <div className="grid grid-cols-2 gap-6"> <input type="text" value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} placeholder="URL YouTube Music" className="w-full bg-transparent border-b border-text-black/20 py-2 outline-none text-sm" /> <input type="text" value={musicCover} onChange={(e) => setMusicCover(e.target.value)} placeholder="URL Pochette" className="w-full bg-transparent border-b border-text-black/20 py-2 outline-none text-sm" /> </div>
                <div className="flex items-center gap-3"> <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Musique Active</span> <button onClick={() => setMusicEnabled(!musicEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${ musicEnabled ? "bg-primary-green" : "bg-text-black/10" }`}> <motion.div animate={{ x: musicEnabled ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm" /> </button> </div>
                <div className="grid grid-cols-2 gap-6"> <input type="text" value={heroTitleMain} onChange={(e) => setHeroTitleMain(e.target.value)} placeholder="Titre Principal" className="w-full bg-transparent border-b border-text-black/20 py-2 outline-none font-serif text-xl" /> <input type="text" value={heroTitleSub} onChange={(e) => setHeroTitleSub(e.target.value)} placeholder="Titre Secondaire" className="w-full bg-transparent border-b border-text-black/20 py-2 outline-none font-serif italic text-xl" /> </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Image d&apos;effet de texte (Remplace la couleur)</label>
                  <input type="text" value={textEffectImage} onChange={(e) => setTextEffectImage(e.target.value)} placeholder="URL Image (ex: grain, gradient...)" className="w-full bg-transparent border-b border-text-black/20 py-2 outline-none text-sm" />
                </div>

                <div className="space-y-6 pt-6 border-t border-text-black/10">
                  <h3 className="font-serif text-2xl">Informations de Profil</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Nom d&apos;affichage</label>
                      <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} placeholder="Ex: Lola Peloille" className="w-full bg-transparent border-b border-text-black/20 py-2 outline-none text-sm text-text-black" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Profession / Rôle</label>
                      <input type="text" value={profileProfession} onChange={(e) => setProfileProfession(e.target.value)} placeholder="Ex: Artiste peintre" className="w-full bg-transparent border-b border-text-black/20 py-2 outline-none text-sm text-text-black" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Biographie (Bio)</label>
                    <textarea value={profileBio} onChange={(e) => setProfileBio(e.target.value)} placeholder="Quelques mots sur vous..." rows={3} className="w-full bg-transparent border border-text-black/20 rounded-md p-3 outline-none text-sm resize-none focus:border-primary-green transition-all text-text-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Image de profil (Avatar)</label>
                    <div className="flex gap-4 items-center">
                      {profileImage && (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-text-black/10 shrink-0">
                          <Image src={profileImage} alt="Avatar Profile" fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <input type="text" value={profileImage} onChange={(e) => setProfileImage(e.target.value)} placeholder="URL de l'image de profil" className="flex-1 bg-transparent border-b border-text-black/20 py-2 outline-none text-sm text-text-black" />
                      <label className="bg-text-black/5 border border-text-black/10 hover:bg-text-black/10 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 cursor-pointer transition-all text-text-black">
                        <Upload size={12} /> Importer
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProfileImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }} 
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Modèle 3D Arrière-plan</span>
                  <button onClick={() => setShow3DBackground(!show3DBackground)} className={`w-12 h-6 rounded-full transition-colors relative ${ show3DBackground ? "bg-primary-green" : "bg-text-black/10" }`}>
                    <motion.div animate={{ x: show3DBackground ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm" />
                  </button>
                </div>

                {show3DBackground && (
                  <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-text-black/5">
                    {/* Model GLB field */}
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">Modèle 3D GLB (URL du fichier .glb ou Upload local)</label>
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          value={statueModelUrl} 
                          onChange={(e) => setStatueModelUrl(e.target.value)} 
                          className="flex-1 bg-white/5 border border-text-black/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                          placeholder="URL du fichier .glb (ex: https://...)" 
                        />
                        <label className="bg-white/10 border border-text-black/10 hover:bg-white/20 px-6 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all">
                          <Upload size={16} /> Importer GLB
                          <input 
                            type="file" 
                            className="hidden" 
                            accept=".glb,.gltf" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setStatueModelUrl(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </label>
                      </div>
                      <p className="text-[8px] text-white/30 ml-1">Si vide, le modèle 3D par défaut (models/model.glb) sera affiché.</p>
                    </div>

                    {/* Use original textures toggle switch */}
                    <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                      <div className="space-y-0.5">
                        <label className="text-[10px] font-bold uppercase tracking-widest opacity-70">Utiliser les textures d'origine du GLB</label>
                        <p className="text-[8px] text-white/30">Si activé, conserve les textures, ombrages et couleurs internes du fichier GLB au lieu d'appliquer le style marbre/cell-shading.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setUseOriginalMaterial(!useOriginalMaterial)} 
                        className={`w-12 h-6 rounded-full transition-colors relative ${ useOriginalMaterial ? "bg-primary-green" : "bg-text-black/10" }`}
                      >
                        <motion.div animate={{ x: useOriginalMaterial ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm" />
                      </button>
                    </div>

                    {/* Texture field */}
                    <div className={`space-y-2 transition-all duration-300 ${useOriginalMaterial ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                      <label className="text-[9px] font-bold uppercase tracking-widest opacity-40 ml-1">
                        Texture du Modèle 3D (Image URL ou Upload local) {useOriginalMaterial && "(Désactivé car textures d'origine actives)"}
                      </label>
                      <div className="flex gap-4">
                        <input 
                          type="text" 
                          disabled={useOriginalMaterial}
                          value={statueTextureUrl} 
                          onChange={(e) => setStatueTextureUrl(e.target.value)} 
                          className="flex-1 bg-white/5 border border-text-black/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                          placeholder="URL de la texture (ex: https://...)" 
                        />
                        <label className={`bg-white/10 border border-text-black/10 px-6 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all ${useOriginalMaterial ? 'cursor-not-allowed' : 'hover:bg-white/20'}`}>
                          <Upload size={16} /> Importer Image
                          <input 
                            type="file" 
                            disabled={useOriginalMaterial}
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => setStatueTextureUrl(reader.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} 
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Rotation Image Lecteur</span>
                  <button onClick={() => setMusicRotationEnabled(!musicRotationEnabled)} className={`w-12 h-6 rounded-full transition-colors relative ${ musicRotationEnabled ? "bg-primary-green" : "bg-text-black/10" }`}>
                    <motion.div animate={{ x: musicRotationEnabled ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Validation manuelle des commentaires</span>
                  <button onClick={() => setRequireCommentValidation(!requireCommentValidation)} className={`w-12 h-6 rounded-full transition-colors relative ${ requireCommentValidation ? "bg-primary-green" : "bg-text-black/10" }`}>
                    <motion.div animate={{ x: requireCommentValidation ? 24 : 4 }} className="w-4 h-4 bg-white rounded-full absolute top-1 shadow-sm" />
                  </button>
                </div>

                <div className="space-y-6 pt-6 border-t border-text-black/10">
                  <h3 className="font-serif text-2xl">Configuration des Sections</h3>
                  <div className="space-y-4">
                    {sectionsConfig.map((section, idx) => (
                      <div key={section.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-sm border border-text-black/5">
                        <div className="flex flex-col gap-1">
                          <button onClick={() => moveSection(idx, 'up')} className="opacity-30 hover:opacity-100"><ArrowLeft size={12} className="rotate-90" /></button>
                          <button onClick={() => moveSection(idx, 'down')} className="opacity-30 hover:opacity-100"><ArrowLeft size={12} className="-rotate-90" /></button>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold uppercase opacity-40">Titre</label>
                            <input type="text" value={section.label} onChange={(e) => {
                              const newSections = [...sectionsConfig];
                              newSections[idx].label = e.target.value;
                              setSectionsConfig(newSections);
                            }} className="w-full bg-transparent border-b border-text-black/10 py-1 text-sm outline-none" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold uppercase opacity-40">Sous-titre</label>
                            <input type="text" value={section.subLabel || ""} onChange={(e) => {
                              const newSections = [...sectionsConfig];
                              newSections[idx].subLabel = e.target.value;
                              setSectionsConfig(newSections);
                            }} className="w-full bg-transparent border-b border-text-black/10 py-1 text-sm outline-none" />
                          </div>
                        </div>
                        <button onClick={() => {
                          const newSections = [...sectionsConfig];
                          newSections[idx].visible = !newSections[idx].visible;
                          setSectionsConfig(newSections);
                        }} className={`w-10 h-5 rounded-full transition-colors relative ${ section.visible ? "bg-primary-green" : "bg-text-black/10" }`}>
                          <motion.div animate={{ x: section.visible ? 20 : 4 }} className="w-3 h-3 bg-white rounded-full absolute top-1 shadow-sm" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleSaveSettings} className="bg-text-black text-white px-10 py-4 font-bold text-xs tracking-widest uppercase hover:bg-primary-green transition-colors">Enregistrer les réglages</button>
                <h3 className="font-serif text-2xl border-b border-text-black/10 pb-4 pt-4">Sécurité (A2F)</h3>
                <div className="space-y-6">
                  {mfaFactors.length > 0 ? (
                    <div className="bg-green-600/5 p-6 rounded-sm border border-green-600/10 flex justify-between items-center">
                      <div className="flex items-center gap-3 text-green-600"><Check size={20} /><div><p className="font-bold text-sm uppercase tracking-widest">A2F Activée</p></div></div>
                      <button onClick={() => handleMfaUnenroll(mfaFactors[0].id)} className="text-[10px] font-bold text-red-600 uppercase tracking-widest hover:underline">Désactiver</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {!mfaEnrollment ? (
                        <button type="button" onClick={handleMfaEnroll} className="bg-primary-green text-white px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xs hover:bg-red-600 transition-all">Activer l&apos;A2F</button>
                      ) : (
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl space-y-8">
                          <QRCodeSVG value={mfaEnrollment.totp.uri} size={180} />
                          <input type="text" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} placeholder="000 000" className="flex-1 bg-white/5 border border-white/10 py-4 rounded-xl outline-none text-center text-3xl tracking-[0.2em] font-serif focus:border-primary-green transition-all text-white" maxLength={6} autoFocus />
                          <button type="button" onClick={handleMfaVerify} className="bg-text-black text-white px-8 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xs">Vérifier & Activer</button>
                          {mfaError && <p className="text-red-600 text-[10px] font-bold uppercase">{mfaError}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProductModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsProductModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-2xl bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto text-white">
                <form onSubmit={handleSubmitProduct} className="space-y-6">
                  <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <h3 className="font-serif text-3xl italic text-primary-green">
                      {editingProduct ? "Modifier le Produit" : "Nouveau Produit"}
                    </h3>
                    <button type="button" onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Nom du produit *</label>
                      <input 
                        type="text" 
                        value={prodName} 
                        onChange={(e) => setProdName(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                        placeholder="Ex: Logo Design Premium" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Prix (€) *</label>
                      <input 
                        type="number" 
                        value={prodPrice} 
                        onChange={(e) => setProdPrice(Number(e.target.value))} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                        placeholder="Ex: 150" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Description</label>
                    <textarea 
                      value={prodDesc} 
                      onChange={(e) => setProdDesc(e.target.value)} 
                      rows={4} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white resize-none" 
                      placeholder="Décrivez ce produit..." 
                      required 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">URLs des Images (Une par ligne) *</label>
                    <div className="flex gap-4 items-start">
                      <textarea 
                        value={prodImagesText} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setProdImagesText(val);
                        }} 
                        rows={4} 
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white resize-none" 
                        placeholder="https://site.com/image1.jpg&#10;https://site.com/image2.jpg" 
                        required 
                      />
                      <label className="bg-white/10 border border-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all">
                        <Upload size={16} /> Importer
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            files.forEach((file) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProdImagesText(prev => {
                                  const list = prev.trim() ? prev.split('\n') : [];
                                  list.push(reader.result as string);
                                  return list.join('\n');
                                });
                              };
                              reader.readAsDataURL(file);
                            });
                          }} 
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Lien externe optionnel</label>
                      <input 
                        type="text" 
                        value={prodLink} 
                        onChange={(e) => setProdLink(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                        placeholder="https://..." 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Texte du lien</label>
                      <input 
                        type="text" 
                        value={prodLinkText} 
                        onChange={(e) => setProdLinkText(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                        placeholder="Ex: Voir la démo" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Message d'achat personnalisé</label>
                    <textarea 
                      value={prodPurchaseMsg} 
                      onChange={(e) => setProdPurchaseMsg(e.target.value)} 
                      rows={3} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white resize-none" 
                      placeholder="Ex: Bonjour, je souhaite commander ce service..." 
                    />
                  </div>

                  <button type="submit" className="w-full bg-primary-green text-white py-4 rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-red-600 transition-all shadow-2xl shadow-primary-green/30">
                    Enregistrer le Produit
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl p-10 max-h-[90vh] overflow-y-auto text-white">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="flex justify-between items-center border-b border-white/10 pb-6">
                    <h3 className="font-serif text-4xl italic text-primary-green">
                      {editingProject ? "Modifier le Poste" : "Nouveau Poste"}
                    </h3>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white">
                      <X size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Titre du poste *</label>
                      <input 
                        type="text" 
                        value={formTitle} 
                        onChange={(e) => setFormTitle(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                        placeholder="Ex: Refonte Site Web" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Catégorie</label>
                      <input 
                        type="text" 
                        value={formCategory} 
                        onChange={(e) => setFormCategory(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                        placeholder="Ex: Web Design / Développement" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Date *</label>
                      <input 
                        type="text" 
                        value={formDate} 
                        onChange={(e) => setFormDate(e.target.value)} 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                        placeholder="Ex: 2024 ou Mai 2024" 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Statut *</label>
                      <select 
                        value={formStatus} 
                        onChange={(e) => setFormStatus(e.target.value as "Publié" | "Brouillon")} 
                        className="w-full bg-[#111] border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white"
                      >
                        <option value="Publié">Publié</option>
                        <option value="Brouillon">Brouillon</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Image du poste (URL ou Upload local) *</label>
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={formImage} 
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormImage(val);
                        }} 
                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                        placeholder="URL de l'image (ex: https://...)" 
                        required 
                      />
                      <label className="bg-white/10 border border-white/10 hover:bg-white/20 px-6 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer transition-all">
                        <Upload size={16} /> Importer
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => setFormImage(reader.result as string);
                              reader.readAsDataURL(file);
                            }
                          }} 
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Type de Lien *</label>
                      <select 
                        value={formLinkType} 
                        onChange={(e) => setFormLinkType(e.target.value as "external" | "internal")} 
                        className="w-full bg-[#111] border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white"
                      >
                        <option value="internal">Page interne (Détails du projet)</option>
                        <option value="external">Lien externe (Site web, github, etc)</option>
                      </select>
                    </div>
                    {formLinkType === "external" && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">URL Externe *</label>
                        <input 
                          type="text" 
                          value={formUrl} 
                          onChange={(e) => setFormUrl(e.target.value)} 
                          className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white" 
                          placeholder="https://example.com" 
                          required 
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Description / Contenu (Markdown/Texte)</label>
                    <textarea 
                      value={formContent} 
                      onChange={(e) => setFormContent(e.target.value)} 
                      rows={6} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white resize-none" 
                      placeholder="Décrivez le projet en détail..." 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Détails (ex: Temps de lecture, Rôle, Client...) (Non obligatoire)</label>
                    <textarea 
                      value={formDetails} 
                      onChange={(e) => setFormDetails(e.target.value)} 
                      rows={3} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-primary-green transition-all text-white resize-none" 
                      placeholder="Ex: Temps de lecture: 5 min • Rôle: Designer • Client: Lucas" 
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Galerie d'images / vidéos</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => addGalleryItem('image')} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all">
                          <Plus size={14} /> Image URL
                        </button>
                        <button type="button" onClick={() => addGalleryItem('video')} className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all">
                          <Plus size={14} /> Vidéo YouTube
                        </button>
                      </div>
                    </div>

                    {formGallery.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                        {formGallery.map((item, idx) => {
                          const ytId = getYoutubeId(item.url);
                          const displayUrl = ytId ? getYoutubeThumbnail(ytId) : item.url;
                          return (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                              <Image src={displayUrl} alt="Gallery item" fill className="object-cover" unoptimized />
                              {item.type === 'video' && <div className="absolute inset-0 flex items-center justify-center bg-black/30"><Zap size={20} className="text-white fill-current animate-pulse" /></div>}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                                <button type="button" onClick={() => moveGalleryItem(idx, 'up')} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white"><ArrowLeft size={12} className="rotate-90" /></button>
                                <button type="button" onClick={() => moveGalleryItem(idx, 'down')} className="p-1.5 bg-white/20 hover:bg-white/40 rounded-lg text-white"><ArrowLeft size={12} className="-rotate-90" /></button>
                                <button type="button" onClick={() => removeGalleryItem(idx)} className="p-2 bg-red-600 text-white rounded-lg"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <button type="submit" className="w-full bg-primary-green text-white py-5 rounded-2xl font-bold text-xs tracking-widest uppercase hover:bg-red-600 transition-all shadow-2xl shadow-primary-green/30">
                    ENREGISTRER LE POSTE
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {uploadSuccess && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="fixed bottom-12 right-12 bg-primary-green text-white px-8 py-4 rounded-2xl font-bold text-xs tracking-widest shadow-2xl uppercase flex items-center gap-3 border border-white/20 backdrop-blur-xl">
            <Check size={18} /> Synchronisé !
          </motion.div>
        )}

        {selectedAttachment && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedAttachment(null)} className="absolute inset-0 bg-soft-black/90 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full h-full flex items-center justify-center">
              <button onClick={() => setSelectedAttachment(null)} className="absolute top-8 right-8 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"><CloseIcon size={32} /></button>
              <div className="relative w-full h-full"><Image src={selectedAttachment} alt="full-attachment" fill className="object-contain" unoptimized /></div>
            </motion.div>
          </motion.div>
        )}

        <AnimatePresence>
          {ipHistoryUserId && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#111] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl relative">
                <button onClick={() => setIpHistoryUserId(null)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"><X size={24} /></button>
                <h2 className="text-2xl font-serif text-white mb-6">Historique IP</h2>
                
                {isFetchingIps ? (
                  <div className="py-12 flex justify-center"><div className="w-8 h-8 border-2 border-primary-green border-t-transparent rounded-full animate-spin"></div></div>
                ) : ipHistoryData.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {ipHistoryData.map((item, idx) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                        <span className="font-mono text-sm text-blue-400">{item.ip}</span>
                        <span className="text-[10px] uppercase text-white/40">{new Date(item.last_sign_in).toLocaleString('fr-FR')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 italic text-center py-6">Aucun historique disponible.</p>
                )}
                
                <p className="text-[10px] text-white/30 mt-6 text-center leading-relaxed">
                  Note: Nécessite la fonction SQL <code className="bg-white/10 px-1 py-0.5 rounded">get_user_ips</code> dans Supabase.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isGlobalIpModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#111] border border-primary-green/30 rounded-3xl p-8 max-w-2xl w-full shadow-[0_0_50px_rgba(255,49,49,0.1)] relative">
                <button onClick={() => setIsGlobalIpModalOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"><X size={24} /></button>
                <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-4">
                  <div className="p-3 bg-primary-green/10 text-primary-green rounded-xl"><User size={24} /></div>
                  <h2 className="text-2xl font-serif text-white">Logs Globaux des Visiteurs (IP)</h2>
                </div>
                
                {isFetchingGlobalIps ? (
                  <div className="py-16 flex justify-center"><div className="w-10 h-10 border-2 border-primary-green border-t-transparent rounded-full animate-spin"></div></div>
                ) : globalIpData.length > 0 ? (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {globalIpData.map((item, idx) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                          <span className="font-mono text-sm text-white/90">{item.ip}</span>
                        </div>
                        <span className="text-[10px] uppercase text-white/40 bg-black/30 px-3 py-1 rounded-full">{new Date(item.visited_at).toLocaleString('fr-FR')}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/40 italic text-center py-10">Aucun visiteur enregistré.</p>
                )}
                
                <p className="text-[10px] text-primary-green mt-6 text-center leading-relaxed font-bold tracking-widest uppercase">
                  Attention: Ces données sont sensibles et privées.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {selectedUserHistory && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setSelectedUserHistory(null)}
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#0c0c0c] border border-white/15 w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col max-h-[80vh] shadow-2xl relative"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={() => setSelectedUserHistory(null)}
                  className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-full transition-colors z-10"
                >
                  <X size={16} />
                </button>

                {/* Header */}
                <div className="bg-white/5 p-6 border-b border-white/10 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/10 border border-white/10 overflow-hidden relative shrink-0 flex items-center justify-center">
                    {selectedUserHistory.profile.avatar_url ? (
                      <Image src={selectedUserHistory.profile.avatar_url} alt="Profile" fill className="object-cover" unoptimized />
                    ) : (
                      <User size={20} className="text-white/40" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-white font-serif text-xl font-bold leading-none">{selectedUserHistory.profile.full_name}</h4>
                    <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1.5">{selectedUserHistory.profile.is_guest ? "Invité" : `ID: ${selectedUserHistory.profile.id}`}</p>
                  </div>
                </div>

                {/* Lists */}
                <div className="p-6 overflow-y-auto space-y-8 flex-1 custom-scrollbar">
                  {/* Messages Section */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-primary-green flex items-center gap-2 border-b border-white/5 pb-2">
                      <Mail size={12} /> Contact & Messages ({selectedUserHistory.messages.length})
                    </h5>
                    {selectedUserHistory.messages.length === 0 ? (
                      <p className="text-xs text-white/30 italic">Aucun message de contact envoyé.</p>
                    ) : (
                      <div className="space-y-3 pl-2">
                        {selectedUserHistory.messages.map((m: any) => (
                          <div key={m.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <span className="text-[10px] font-bold text-white/80 uppercase">{m.title || "Sans titre"}</span>
                              <span className="text-[9px] text-white/30 uppercase">{new Date(m.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comments Section */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-widest text-green-400 flex items-center gap-2 border-b border-white/5 pb-2">
                      <Heart size={12} className="fill-green-400/20" /> Commentaires ({selectedUserHistory.comments.length})
                    </h5>
                    {selectedUserHistory.comments.length === 0 ? (
                      <p className="text-xs text-white/30 italic">Aucun commentaire publié.</p>
                    ) : (
                      <div className="space-y-3 pl-2">
                        {selectedUserHistory.comments.map((c: any) => (
                          <div key={c.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                                {c.parent_id ? "Réponse" : "Commentaire"}
                              </span>
                              <span className="text-[8px] text-white/30 uppercase">{new Date(c.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{c.content}</p>
                            {c.image_url && (
                              <div className="relative w-20 aspect-video rounded-xl border border-white/10 overflow-hidden mt-2">
                                <Image src={c.image_url} alt="Attached image" fill className="object-cover" unoptimized />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </motion.div>
  );
}

