'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface OrderNote {
  id: string;
  content: string;
  type: 'internal' | 'customer' | 'system';
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface OrderNotesSectionProps {
  notes: OrderNote[];
  onAddNote?: (content: string, type: 'internal' | 'customer') => Promise<void>;
}

export default function OrderNotesSection({
  notes,
  onAddNote,
}: OrderNotesSectionProps) {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'internal' | 'customer'>('internal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim() || !onAddNote) return;

    setIsSubmitting(true);
    try {
      await onAddNote(newNote, noteType);
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getNoteBadgeVariant = (type: OrderNote['type']) => {
    switch (type) {
      case 'internal':
        return 'secondary';
      case 'customer':
        return 'default';
      case 'system':
        return 'outline';
      default:
        return 'default';
    }
  };

  const sortedNotes = [...notes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Order Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={noteType === 'internal' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNoteType('internal')}
            >
              Internal
            </Button>
            <Button
              type="button"
              variant={noteType === 'customer' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setNoteType('customer')}
            >
              Customer
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Textarea
              placeholder={
                noteType === 'internal'
                  ? 'Add an internal note (not visible to customer)'
                  : 'Add a note visible to the customer'
              }
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px]"
              disabled={isSubmitting}
            />
          </div>
          
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || isSubmitting}
            size="sm"
          >
            <Send className="mr-2 h-4 w-4" />
            {isSubmitting ? 'Adding...' : 'Add Note'}
          </Button>
        </div>

        {/* Notes List */}
        <div className="space-y-3 pt-4 border-t">
          {sortedNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet. Add a note to keep track of order updates.
            </p>
          ) : (
            sortedNotes.map((note) => (
              <div
                key={note.id}
                className="flex gap-3 p-3 rounded-lg border bg-card"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={note.createdBy.avatar} />
                  <AvatarFallback>
                    {note.createdBy.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {note.createdBy.name}
                    </span>
                    <Badge variant={getNoteBadgeVariant(note.type)} className="text-xs">
                      {note.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(note.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
