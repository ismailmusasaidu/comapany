import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Plus, Trash2, Loader } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  position: string;
  bio: string;
  image_url: string;
  order_index: number;
}

export default function AdminTeamPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data, error: err } = await supabase
        .from('team_members')
        .select('*')
        .order('order_index', { ascending: true });

      if (err) throw err;
      setMembers(data || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to fetch team members: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addMember = () => {
    const newMember: TeamMember = {
      id: `new-${Date.now()}`,
      name: 'New Member',
      position: 'Position',
      bio: '',
      image_url: '',
      order_index: members.length,
    };
    setMembers([...members, newMember]);
  };

  const removeMember = async (id: string) => {
    if (id.startsWith('new-')) {
      setMembers(members.filter(m => m.id !== id));
    } else {
      try {
        const { error: err } = await supabase
          .from('team_members')
          .delete()
          .eq('id', id);

        if (err) throw err;
        setMembers(members.filter(m => m.id !== id));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete member');
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    try {
      for (const member of members) {
        if (member.id.startsWith('new-')) {
          const { error: insertErr } = await supabase
            .from('team_members')
            .insert([{
              name: member.name,
              position: member.position,
              bio: member.bio,
              image_url: member.image_url,
              order_index: member.order_index,
            }]);

          if (insertErr) throw insertErr;
        } else {
          const { error: updateErr } = await supabase
            .from('team_members')
            .update({
              name: member.name,
              position: member.position,
              bio: member.bio,
              image_url: member.image_url,
              order_index: member.order_index,
              updated_at: new Date().toISOString(),
            })
            .eq('id', member.id);

          if (updateErr) throw updateErr;
        }
      }

      alert('Team members updated successfully!');
      await fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-slate-900" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Manage Team Members</h1>
          </div>
          <button
            onClick={addMember}
            className="flex items-center space-x-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {members.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow p-6">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) =>
                      setMembers(members.map(m =>
                        m.id === member.id ? { ...m, name: e.target.value } : m
                      ))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <input
                    type="text"
                    value={member.position}
                    onChange={(e) =>
                      setMembers(members.map(m =>
                        m.id === member.id ? { ...m, position: e.target.value } : m
                      ))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={member.bio}
                  onChange={(e) =>
                    setMembers(members.map(m =>
                      m.id === member.id ? { ...m, bio: e.target.value } : m
                    ))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={member.image_url}
                  onChange={(e) =>
                    setMembers(members.map(m =>
                      m.id === member.id ? { ...m, image_url: e.target.value } : m
                    ))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={() => removeMember(member.id)}
                className="flex items-center space-x-2 text-red-500 hover:text-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Remove</span>
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-6 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save All Changes'}
        </button>
      </div>
    </div>
  );
}
