"use client";
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { v4 as uuidv4 } from 'uuid';
import { DocumentIcon, ShieldLockIcon, PlusIcon, ClockIcon, CloseIcon } from '../components/Icons';
import io from 'socket.io-client';

// Initialize socket outside of the component to prevent multiple connections
const socket = io('http://localhost:5000');

// ====================== Interfaces ======================
interface Comment {
  id: string;
  text: string;
  author: 'reporter' | 'authority';
  timestamp: string;
}

interface Concern {
  id: string;
  date: string;
  category: string;
  status: 'Pending' | 'Resolved' | 'Under Review';
  description: string;
  companyName: string;
  files: any[]; // Changed from File[] for server compatibility
  comments?: Comment[];
}

// ====================== Constants ======================
const industries = ['Ramdeobaba College', 'Police', 'Layers', 'Media House', 'Cyber Cell', 'Human Welfare NGO'];

// ====================== Main Component ======================
export default function DashboardPage() {
  const [showNewReport, setShowNewReport] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedConcernId, setSelectedConcernId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [concerns, setConcerns] = useState<Concern[]>([]);

  const [newReport, setNewReport] = useState({
    title: '',
    description: '',
    companyName: '',
    files: [] as File[],
  });

  const selectedConcern = concerns.find(c => c.id === selectedConcernId); // Finds the selected concern for details view

  // Fetch concerns from the API
  useEffect(() => {
    const fetchConcerns = async () => {
      try {
        setLoading(true);
        console.log('Fetching concerns from API...');
        const response = await fetch('http://localhost:5000/api/concerns');
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Concerns fetched:', data);
        setConcerns(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching concerns:', error);
        setError('Failed to connect to the server. Please make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchConcerns();
  }, []);

  // Handle socket connections
  useEffect(() => {
    // Setup socket connection
    console.log('Setting up socket connection...');
    
    socket.on('connect', () => {
      console.log('Socket connected with ID:', socket.id);
    });
    
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError('Failed to establish WebSocket connection.');
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection...');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (data: Comment) => {
      console.log('Received message:', data);

      // Ensure the message is unique before adding it to the state
      setComments((prevComments) => {
        const isDuplicate = prevComments.some((comment) => comment.id === data.id);
        if (!isDuplicate) {
          return [...prevComments, data];
        }
        return prevComments;
      });
    };

    // Set up the event listener
    socket.on('receive_message', handleReceiveMessage);

    // Clean up the event listener on unmount
    return () => {
      socket.off('receive_message', handleReceiveMessage);
    };
  }, [socket]);

  // Join room and listen for messages when a concern is selected
  useEffect(() => {
    if (selectedConcernId) {
      console.log('Joining room for concern:', selectedConcernId);
      
      // Join the room for the selected concern
      socket.emit('join_room', { concernId: selectedConcernId });
    }
  }, [selectedConcernId]);

  // Handle selecting a concern
  const handleSelectConcern = (id: string) => {
    setSelectedConcernId(id);
    
    // Reset comments when selecting a new concern
    const concern = concerns.find(c => c.id === id);
    const uniqueComments = concern?.comments.filter(
      (comment, index, self) => index === self.findIndex((c) => c.id === comment.id)
    );
    setComments(uniqueComments || []);    
    console.log('Selected concern:', id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewReport((prev) => ({ ...prev, files: [...prev.files, ...files] }));
  };

  const handleSubmitReport = async () => {
    try {
      setLoading(true);
      const newConcern = {
        title: newReport.title,
        description: newReport.description,
        companyName: newReport.companyName,
        files: [], // Handle file uploads separately in a production app
      };

      console.log('Submitting new report:', newConcern);
      const response = await fetch('http://localhost:5000/api/concerns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newConcern),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Report submitted successfully:', data);
        setConcerns((prev) => [...prev, data]);
        setShowNewReport(false);
        setCurrentStep(1);
        setSelectedIndustry('');
        setNewReport({ title: '', description: '', companyName: '', files: [] });
        setError(null);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setError('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

const handleAddComment = () => {
  if (newComment.trim() && selectedConcernId) {
    // Emit to backend
    socket.emit('send_message', {
      concernId: selectedConcernId,
      message: newComment,
      sender: 'reporter',
    });

    // Clear input field
    setNewComment('');
  }
};

  const updateStatus = async (newStatus: 'Pending' | 'Resolved' | 'Under Review') => {
    if (!selectedConcernId) return;

    try {
      setLoading(true);
      console.log('Updating status to:', newStatus);
      const response = await fetch(`http://localhost:5000/api/concerns/${selectedConcernId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedConcern = await response.json();
        setConcerns((prev) =>
          prev.map((concern) =>
            concern.id === selectedConcernId ? { ...concern, status: updatedConcern.status } : concern
          )
        );
        setError(null);
      } else {
        throw new Error(`Server responded with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

// ====================== Concern Details Modal ======================
  const renderDetailsModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-xl w-full max-w-4xl p-6 relative border border-gray-800 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={() => setSelectedConcernId(null)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-6">Case Details - {selectedConcern?.id}</h2>
        
        {/* Concern Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-gray-400 mb-2">Category</h3>
            <p className="text-lg">{selectedConcern?.category}</p>
          </div>
          <div>
            <h3 className="text-gray-400 mb-2">Reported Company</h3>
            <p className="text-lg">{selectedConcern?.companyName}</p>
          </div>
          <div>
            <h3 className="text-gray-400 mb-2">Date Reported</h3>
            <p className="text-lg">{selectedConcern?.date}</p>
          </div>
          <div>
            <h3 className="text-gray-400 mb-2">Current Status</h3>
            <span className={`px-3 py-1 rounded-full text-lg ${
              selectedConcern?.status === 'Resolved' ? 'bg-green-900 text-green-300' :
              'bg-rose-600 text-white'
            }`}>
              {selectedConcern?.status}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-gray-400 mb-2">Description</h3>
          <p className="text-gray-300 whitespace-pre-wrap">{selectedConcern?.description}</p>
        </div>

        {/* Attachments */}
        <div className="mb-8">
          <h3 className="text-gray-400 mb-4">Attachments</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {selectedConcern?.files.map((file, index) => (
              <div key={index} className="border border-gray-700 p-3 rounded-lg">
                <DocumentIcon className="w-6 h-6 mb-2 text-pink-400" />
                <p className="text-sm text-gray-400 truncate">{file.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Status Update */}
        <div className="mb-8">
          <h3 className="text-gray-400 mb-4">Update Case Status</h3>
          <div className="flex gap-4">
            <button
              onClick={() => updateStatus('Resolved')}
              className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg"
            >
              Mark as Resolved
            </button>
            <button
              onClick={() => updateStatus('Pending')}
              className="bg-rose-600 hover:bg-rose-700 px-6 py-2 rounded-lg"
            >
              Re-open Case
            </button>
          </div>
        </div>

        {/* Case Communication */}
        <div className="border-t border-gray-800 pt-6">
          <h3 className="text-gray-400 mb-4">Case Communication</h3>
          
          {/* Comments List */}
          <div className="space-y-4 mb-6">
            {comments.map(comment => (
  <div 
    key={comment.id}  // Use the unique ID from the backend or optimistic update
    className={`p-4 rounded-lg ${comment.author === 'reporter' ? 'bg-gray-800 ml-4' : 'bg-gray-700 mr-4'}`}
  >
    <div className="flex justify-between mb-2">
      <span className="text-sm text-pink-400">{comment.author}</span>
      <span className="text-xs text-gray-500">{comment.timestamp}</span>
    </div>
    <p className="text-gray-300">{comment.text}</p>
  </div>
))}          </div>

          {/* Add Comment */}
          <div className="flex gap-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-gray-800 rounded-lg p-3 border border-gray-700 focus:border-pink-400"
            />
            <button
              onClick={handleAddComment}
              className="bg-pink-500 hover:bg-pink-600 px-6 py-3 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ====================== Render ======================
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <Head>
        <title>ReporterX - Dashboard</title>
      </Head>

      {/* New Report Modal */}
      {showNewReport && (
        <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-xl w-full max-w-2xl p-6 relative border border-gray-800">
            <button 
              onClick={() => setShowNewReport(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <CloseIcon className="w-6 h-6" />
            </button>

            {currentStep === 1 ? (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold mb-4">Select Industry to Report to</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {industries.map((industry) => (
                    <button
                      key={industry}
                      onClick={() => {
                        setSelectedIndustry(industry);
                        setCurrentStep(2);
                      }}
                      className="p-4 border border-gray-800 rounded-lg hover:border-pink-400 transition-colors"
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold">New Report - {selectedIndustry}</h3>
                
                {/* New Report Form */}
                <div>
                  <label className="block text-gray-300 mb-2">Report Title (Category)</label>
                  <input
                    type="text"
                    value={newReport.title}
                    onChange={(e) => setNewReport({ ...newReport, title: e.target.value })}
                    className="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 focus:border-pink-400"
                    placeholder="Enter report title that will be shown as category"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Company/Culprit Name</label>
                  <input
                    type="text"
                    value={newReport.companyName}
                    onChange={(e) => setNewReport({ ...newReport, companyName: e.target.value })}
                    className="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Description</label>
                  <textarea
                    value={newReport.description}
                    onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                    className="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 focus:border-pink-400 h-32"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Upload Proofs</label>
                  <label className="w-full bg-gray-800 rounded-lg p-3 border border-gray-700 flex items-center justify-center cursor-pointer hover:border-pink-400">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.png,.mp4"
                    />
                    <span className="text-pink-400">
                      {newReport.files.length > 0 
                        ? `${newReport.files.length} files selected`
                        : 'Choose Files'}
                    </span>
                  </label>
                  <div className="mt-2 space-y-2">
                    {newReport.files.map((file, index) => (
                      <div key={index} className="text-sm text-gray-400 flex items-center">
                        <DocumentIcon className="w-4 h-4 mr-2" />
                        {file.name}
                        <button
                          onClick={() => {
                            const updatedFiles = [...newReport.files];
                            updatedFiles.splice(index, 1);
                            setNewReport(prev => ({ ...prev, files: updatedFiles }));
                          }}
                          className="ml-2 text-red-400 hover:text-red-300"
                        >
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSubmitReport}
                  className="w-full bg-pink-500 hover:bg-pink-600 py-3 rounded-lg font-medium"
                >
                  Submit Report
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Concern Details Modal */}
      {selectedConcernId && renderDetailsModal()}

      {/* Navbar */}
      <nav className="sticky top-0 bg-gray-900 bg-opacity-80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldLockIcon className="w-6 h-6 text-pink-400" />
            <span className="text-xl font-bold">ReporterX</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => setShowNewReport(true)}
              className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 px-6 py-2 rounded-full"
            >
              <PlusIcon className="w-4 h-4" />
              <span>New Report</span>
            </button>
            <div className="h-8 w-8 bg-gray-800 rounded-full flex items-center justify-center">
              <DocumentIcon className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-gray-400 mb-2">Total Reports</h3>
            <p className="text-3xl font-bold">{concerns.length}</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-gray-400 mb-2">Pending Actions</h3>
            <p className="text-3xl font-bold text-amber-400">
              {concerns.filter(c => c.status === 'Pending').length}
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h3 className="text-gray-400 mb-2">Avg. Response Time</h3>
            <div className="flex items-center space-x-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <p className="text-3xl font-bold">14d</p>
            </div>
          </div>
        </div>

        {/* Concerns Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold">Your Active Concerns</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-850">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Case ID</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>{concerns.map((concern, index) => (<tr key={`${concern.id}-${index}`} className="border-b border-gray-700 hover:bg-gray-850 transition-colors">
    <td className="px-6 py-4 font-mono text-pink-400">{concern.id}</td>
    <td className="px-6 py-4">{concern.date}</td>
    <td className="px-6 py-4">{concern.category}</td>
    <td className="px-6 py-4">
      <span className={`px-3 py-1 rounded-full text-sm ${
        concern.status === 'Resolved' ? 'bg-green-900 text-green-300' :
        'bg-rose-600 text-white'
      }`}>
        {concern.status}
      </span>
    </td>
    <td className="px-6 py-4 space-x-4">
      <button 
        onClick={() => setSelectedConcernId(concern.id)}
        className="text-pink-400 hover:text-pink-300"
      >
        View Details
      </button>
      <button className="text-gray-400 hover:text-gray-300">
        Download Receipt
      </button>
    </td>
  </tr>
))}              </tbody>
            </table>
          </div>
        </div>

        {/* Security Reminder */}
        <div className="mt-12 bg-gray-800 p-6 rounded-xl border border-pink-900">
          <div className="flex items-start space-x-4">
            <ShieldLockIcon className="w-6 h-6 text-pink-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold mb-2">Security Reminder</h3>
              <p className="text-gray-400">
                Remember to always use a secure connection and avoid sharing personal details. 
                Your identity remains protected through end-to-end encryption.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
