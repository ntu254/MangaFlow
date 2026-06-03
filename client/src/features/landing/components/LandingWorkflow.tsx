import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  BookOpen,
  PenLine,
  Image,
  ListTodo,
  CheckCircle,
  LayoutDashboard,
  Wallet,
  ArrowRight,
} from "lucide-react";

const steps = [
  { icon: BookOpen, label: "Series", color: "#9065d5" },
  { icon: PenLine, label: "Manuscript", color: "#e560bc" },
  { icon: Image, label: "Pages", color: "#ff7196" },
  { icon: ListTodo, label: "Tasks", color: "#ff9971" },
  { icon: CheckCircle, label: "Review", color: "#ffc95e" },
  { icon: LayoutDashboard, label: "Board", color: "#f9f871" },
  { icon: Wallet, label: "Payroll", color: "#9065d5" },
];

export function LandingWorkflow() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="workflow" className="px-6 py-24">
      <div className="mx-auto max-w-7xl" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#ff9971]">
            Workflow
          </p>
          <h2 className="text-3xl font-bold text-[#2f243a] md:text-4xl">
            From idea to published chapter
          </h2>
          <p className="mt-4 text-lg text-[#5f5270]">
            A streamlined pipeline that keeps your team aligned at every stage.
          </p>
        </motion.div>

        <div className="relative mx-auto max-w-5xl">
          <div className="absolute left-0 right-0 top-1/2 hidden h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[#eadff6] to-transparent lg:block" />

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            {steps.map((step, i) => (
              <motion.div
                key={step.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="group relative flex flex-col items-center text-center"
              >
                <div
                  className="relative z-10 mb-3 flex size-14 items-center justify-center rounded-2xl border border-[#eadff6] bg-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_24px_rgba(144,101,213,0.15)]"
                >
                  <step.icon
                    className="size-6"
                    style={{ color: step.color }}
                  />
                </div>
                <span className="text-sm font-semibold text-[#2f243a]">
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <ArrowRight className="absolute right-0 top-5 hidden size-4 text-[#d4c4ee] lg:block" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
