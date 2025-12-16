import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionApi, participantApi, itemApi, settlementApi } from '../services/api';
import type { SessionDetail, Participant, Item, Settlement } from '../types';

function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'items' | 'settlement'>('items');

  const [newParticipantName, setNewParticipantName] = useState('');
  const [friendCode, setFriendCode] = useState('');
  const [addMode, setAddMode] = useState<'name' | 'code'>('name');
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  useEffect(() => {
    if (id) {
      loadSession();
    }
  }, [id]);

  const loadSession = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const [sessionRes, settlementRes] = await Promise.all([
        sessionApi.getById(id),
        settlementApi.get(id),
      ]);
      setSession(sessionRes.data);
      setSettlement(settlementRes.data);
      setError('');
    } catch (err) {
      setError('Failed to load session');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      if (addMode === 'name') {
        if (!newParticipantName.trim()) return;
        await participantApi.create(id, { name: newParticipantName });
        setNewParticipantName('');
      } else {
        if (!friendCode.trim()) return;
        await participantApi.create(id, { friendCode: friendCode.trim() });
        setFriendCode('');
      }
      loadSession();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add participant');
      console.error(err);
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) return;

    try {
      await participantApi.delete(participantId);
      loadSession();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete participant');
      console.error(err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      await itemApi.delete(itemId);
      loadSession();
    } catch (err) {
      setError('Failed to delete item');
      console.error(err);
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setShowItemForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Session not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline mb-2"
          >
            ← Back to sessions
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{session.name}</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Participants</h2>
            <form onSubmit={handleAddParticipant} className="mb-4">
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setAddMode('name')}
                  className={`px-3 py-1 text-sm rounded ${
                    addMode === 'name'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  By Name
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('code')}
                  className={`px-3 py-1 text-sm rounded ${
                    addMode === 'code'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  By Friend Code
                </button>
              </div>
              <div className="flex gap-2">
                {addMode === 'name' ? (
                  <input
                    type="text"
                    value={newParticipantName}
                    onChange={(e) => setNewParticipantName(e.target.value)}
                    placeholder="Enter name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value)}
                    placeholder="Enter friend code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </form>
            {session.participants.length === 0 ? (
              <p className="text-gray-500 text-sm">No participants yet</p>
            ) : (
              <ul className="space-y-2">
                {session.participants.map((participant) => (
                  <li
                    key={participant.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex-1">
                      {participant.friend ? (
                        <div
                          onClick={() => navigate(`/friend/${participant.friend!.friendCode}`)}
                          className="cursor-pointer hover:text-blue-600"
                        >
                          <span>{participant.name}</span>
                          <span className="ml-2 text-xs text-blue-600">🔗 Linked</span>
                        </div>
                      ) : (
                        <span>{participant.name}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteParticipant(participant.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('items')}
                    className={`pb-2 font-medium ${
                      activeTab === 'items'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    Items
                  </button>
                  <button
                    onClick={() => setActiveTab('settlement')}
                    className={`pb-2 font-medium ${
                      activeTab === 'settlement'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    Settlement
                  </button>
                </div>
                {activeTab === 'items' && (
                  <button
                    onClick={() => setShowItemForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    disabled={session.participants.length === 0}
                  >
                    Add Item
                  </button>
                )}
              </div>

              {activeTab === 'items' && (
                <div>
                  {session.items.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No items yet. Add participants first, then add items.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {session.items.map((item) => (
                        <div
                          key={item.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="font-medium">{item.description}</h3>
                              <p className="text-sm text-gray-600">
                                Total: ${item.totalAmount.toFixed(2)} • Paid by{' '}
                                {item.paidBy.name}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            Split among: {item.splits.map((s) => `${s.participant.name} ($${s.share.toFixed(2)})`).join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'settlement' && settlement && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Who Owes Whom</h3>
                    {settlement.debts.length === 0 ? (
                      <p className="text-gray-500">All settled up!</p>
                    ) : (
                      <ul className="space-y-2">
                        {settlement.debts.map((debt, index) => (
                          <li
                            key={index}
                            className="p-3 bg-yellow-50 border border-yellow-200 rounded"
                          >
                            <span className="font-medium">{debt.fromName}</span> owes{' '}
                            <span className="font-medium">{debt.toName}</span>{' '}
                            <span className="font-bold text-green-600">
                              ${debt.amount.toFixed(2)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Summary</h3>
                    <div className="space-y-2">
                      {settlement.participantSummaries.map((summary) => (
                        <div
                          key={summary.participantId}
                          className="p-3 bg-gray-50 rounded"
                        >
                          <div className="font-medium mb-1">{summary.name}</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Paid: ${summary.totalPaid.toFixed(2)}</div>
                            <div>Owes: ${summary.totalOwed.toFixed(2)}</div>
                            <div
                              className={`font-medium ${
                                summary.netBalance > 0
                                  ? 'text-green-600'
                                  : summary.netBalance < 0
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              Net:{' '}
                              {summary.netBalance > 0 ? '+' : ''}
                              ${summary.netBalance.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {showItemForm && (
          <ItemFormModal
            sessionId={id!}
            participants={session.participants}
            editingItem={editingItem}
            onClose={() => {
              setShowItemForm(false);
              setEditingItem(null);
            }}
            onSuccess={() => {
              setShowItemForm(false);
              setEditingItem(null);
              loadSession();
            }}
          />
        )}
      </div>
    </div>
  );
}

interface ItemFormModalProps {
  sessionId: string;
  participants: Participant[];
  editingItem?: Item | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ItemFormModal({ sessionId, participants, editingItem, onClose, onSuccess }: ItemFormModalProps) {
  const [description, setDescription] = useState(editingItem?.description || '');
  const [totalAmount, setTotalAmount] = useState(editingItem?.totalAmount.toString() || '');
  const [paidById, setPaidById] = useState(editingItem?.paidById || '');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    editingItem?.splits.map(s => s.participantId) || []
  );
  const [splitType, setSplitType] = useState<'equal' | 'custom'>(() => {
    if (!editingItem) return 'equal';
    const allEqual = editingItem.splits.every(s => s.share === editingItem.splits[0].share);
    return allEqual ? 'equal' : 'custom';
  });
  const [customSplits, setCustomSplits] = useState<{ [key: string]: string }>(() => {
    if (!editingItem) return {};
    const amounts: Record<string, string> = {};
    editingItem.splits.forEach(split => {
      amounts[split.participantId] = split.share.toString();
    });
    return amounts;
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim() || !totalAmount || !paidById || selectedParticipants.length === 0) {
      setError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Invalid amount');
      return;
    }

    let splits;
    if (splitType === 'equal') {
      const sharePerPerson = amount / selectedParticipants.length;
      splits = selectedParticipants.map((participantId) => ({
        participantId,
        share: sharePerPerson,
      }));
    } else {
      splits = selectedParticipants.map((participantId) => ({
        participantId,
        share: parseFloat(customSplits[participantId] || '0'),
      }));

      const total = splits.reduce((sum, s) => sum + s.share, 0);
      if (Math.abs(total - amount) > 0.01) {
        setError(`Splits must sum to ${amount}`);
        return;
      }
    }

    try {
      const itemData = {
        description,
        totalAmount: amount,
        paidById,
        splits,
      };

      if (editingItem) {
        await itemApi.update(editingItem.id, itemData);
      } else {
        await itemApi.create(sessionId, itemData);
      }

      onSuccess();
    } catch (err) {
      setError(editingItem ? 'Failed to update item' : 'Failed to create item');
      console.error(err);
    }
  };

  const handleToggleParticipant = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.includes(participantId)
        ? prev.filter((id) => id !== participantId)
        : [...prev, participantId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">
            {editingItem ? 'Edit Item' : 'Add Item'}
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Pizza"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Total Amount</label>
              <input
                type="number"
                step="0.01"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Paid By</label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select participant</option>
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Split Among</label>
              <div className="space-y-2">
                {participants.map((p) => (
                  <label key={p.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedParticipants.includes(p.id)}
                      onChange={() => handleToggleParticipant(p.id)}
                      className="rounded"
                    />
                    <span>{p.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedParticipants.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Split Type</label>
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="equal"
                      checked={splitType === 'equal'}
                      onChange={() => setSplitType('equal')}
                    />
                    <span>Equal Split</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="custom"
                      checked={splitType === 'custom'}
                      onChange={() => setSplitType('custom')}
                    />
                    <span>Custom Amounts</span>
                  </label>
                </div>

                {splitType === 'custom' && (
                  <div className="space-y-2 mt-3">
                    {selectedParticipants.map((participantId) => {
                      const participant = participants.find((p) => p.id === participantId);
                      return (
                        <div key={participantId} className="flex items-center gap-2">
                          <label className="w-32">{participant?.name}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={customSplits[participantId] || ''}
                            onChange={(e) =>
                              setCustomSplits((prev) => ({
                                ...prev,
                                [participantId]: e.target.value,
                              }))
                            }
                            className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SessionPage;
