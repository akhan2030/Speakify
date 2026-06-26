type Props = {
  title: string;
  description: string;
};

export default function AdminPlaceholderPage({ title, description }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold text-[#0d1b35]">{title}</h1>
      <p className="mt-2 max-w-xl text-slate-600">{description}</p>
      <p className="mt-6 inline-block rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-500">
        Coming soon
      </p>
    </div>
  );
}
