import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Layers,
  FileText,
  Users,
  MessageSquare,
  BarChart3,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Series Management",
    description:
      "Create, organize, and track your manga series from concept to publication with rich metadata and cover art.",
    color: "#9065d5",
    bg: "bg-[#9065d5]/[0.06]",
  },
  {
    icon: FileText,
    title: "Chapter Workflow",
    description:
      "Upload pages, manage chapters, and track progress through your pipeline with intuitive drag-and-drop.",
    color: "#e560bc",
    bg: "bg-[#e560bc]/[0.06]",
  },
  {
    icon: Users,
    title: "Task Assignment",
    description:
      "Delegate work to assistants and freelancers with priorities, deadlines, and rate tracking built in.",
    color: "#ff7196",
    bg: "bg-[#ff7196]/[0.06]",
  },
  {
    icon: MessageSquare,
    title: "Real-time Collaboration",
    description:
      "Comment on pages, annotate regions, and run revision loops — all in context without leaving the workspace.",
    color: "#ff9971",
    bg: "bg-[#ff9971]/[0.06]",
  },
  {
    icon: BarChart3,
    title: "Board Dashboard",
    description:
      "Analytics, rankings, series reviews, and payroll at a glance — everything leadership needs in one view.",
    color: "#ffc95e",
    bg: "bg-[#ffc95e]/[0.08]",
  },
  {
    icon: Shield,
    title: "Secure Auth & Roles",
    description:
      "Role-based access control with Clerk — Mangaka, Editor, Assistant, and Board each get their own workspace.",
    color: "#9065d5",
    bg: "bg-[#9065d5]/[0.06]",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

export function LandingFeatures() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="features" className="px-6 py-24">
      <div className="mx-auto max-w-7xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#e560bc]">
            Features
          </p>
          <h2 className="text-3xl font-bold text-[#2f243a] md:text-4xl">
            Everything you need to ship manga
          </h2>
          <p className="mt-4 text-lg text-[#5f5270]">
            A complete production toolkit — from first sketch to final payroll.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              className="group relative rounded-2xl border border-[#eadff6] bg-white/80 p-6 shadow-[0_2px_12px_rgba(144,101,213,0.04)] backdrop-blur-sm transition-all duration-300 hover:border-[#d4c4ee] hover:shadow-[0_12px_32px_rgba(144,101,213,0.1)] hover:-translate-y-1"
            >
              <div
                className={`mb-4 inline-flex size-11 items-center justify-center rounded-xl ${feature.bg}`}
              >
                <feature.icon
                  className="size-5"
                  style={{ color: feature.color }}
                />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[#2f243a]">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-[#5f5270]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
