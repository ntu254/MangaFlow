import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type SeriesFormProps = {
  initialData?: {
    title: string;
    description: string;
    genre: string[];
    publicationType: string | null;
  };
  onSubmit: (data: {
    title: string;
    description: string;
    genre: string[];
    publicationType: string | null;
  }) => void;
  isLoading: boolean;
};

const GENRE_OPTIONS = ["Action", "Romance", "Comedy", "Drama", "Sci-Fi", "Fantasy", "Horror", "Mystery", "Slice of Life", "Sports"];

export function SeriesForm({ initialData, onSubmit, isLoading }: SeriesFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [publicationType, setPublicationType] = useState(initialData?.publicationType || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialData?.genre || []);

  const toggleGenre = (g: string) => {
    setSelectedGenres((prev) => 
      prev.includes(g) ? prev.filter((genre) => genre !== g) : [...prev, g]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      genre: selectedGenres,
      publicationType: publicationType || null
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Manga Title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this series about?"
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label>Genres</Label>
        <div className="flex flex-wrap gap-2 pt-2">
          {GENRE_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => toggleGenre(g)}
              className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                selectedGenres.includes(g)
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-transparent text-foreground border-input hover:bg-muted"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="publicationType">Publication Type</Label>
        <select
          id="publicationType"
          value={publicationType}
          onChange={(e) => setPublicationType(e.target.value)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">None / Unspecified</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
        </select>
      </div>

      <Button type="submit" disabled={isLoading || !title.trim()}>
        {isLoading ? "Saving..." : "Save Series"}
      </Button>
    </form>
  );
}
