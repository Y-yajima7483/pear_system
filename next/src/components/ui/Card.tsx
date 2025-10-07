interface Props {
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  children: React.ReactNode;
}

const sizeClasses: Record<NonNullable<Props["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

export default function Card({ title, size = "md", children }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className={`${sizeClasses[size]} mx-auto`}>
        {title && <h1 className="text-3xl font-bold text-center mb-8">{title}</h1>}
        {children}
      </div>
    </div>
  );
}
