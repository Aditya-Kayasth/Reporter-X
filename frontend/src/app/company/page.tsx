"use client";
import { useEffect, useState, useRef, MutableRefObject } from 'react';
import io, { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SOCKET_SERVER_URL = "http://localhost:5000"; // Adjust if deployed differently

// Types
type CommentType = {
  id: string;
  text: string;
  author: string;
  timestamp: string;
};

type ConcernType = {
  id: string;
  title?: string;
  organization?: string;
  status?: string;
  date?: string;
  comments: CommentType[];
};

type MessageType = {
  id?: string;
  concernId: string;
  message: string;
  sender: string;
  timestamp?: string;
};

export default function CompanyDashboardPage() {
  const [concerns, setConcerns] = useState<ConcernType[]>([]);
  const [selectedConcernId, setSelectedConcernId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState<string>('');
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Format timestamp
  const formatTimestamp = (timestamp: string | number | Date | undefined) => {
    if (!timestamp) return "Unknown time";
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      console.error("Invalid timestamp format:", e);
      return "Invalid date";
    }
  };

  // 1. Fetch concerns
  useEffect(() => {
    const fetchConcerns = () => {
      fetch('http://localhost:5000/api/concerns')
        .then(res => res.json())
        .then((data: any[]) => {
          // Ensure all concerns have comments array and proper IDs
          const processedData: ConcernType[] = data.map(concern => ({
            ...concern,
            id: concern.id || uuidv4(), // Ensure ID exists
            comments: Array.isArray(concern.comments) ? concern.comments.map((comment: any) => ({
              ...comment,
              id: comment.id || uuidv4() // Ensure each comment has a unique ID
            })) : []
          }));

          setConcerns(processedData.reverse());

          // If we have concerns, select the first one by default
          if (processedData.length > 0 && !selectedConcernId) {
            setSelectedConcernId(processedData[0].id);
          }
        })
        .catch(error => console.error("Failed to fetch concerns:", error));
    };

    fetchConcerns();

    // Set up periodic refresh - in case socket updates fail
    const intervalId = setInterval(fetchConcerns, 5000);

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // 2. Initialize WebSocket connection
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(SOCKET_SERVER_URL, {
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected with ID:', socketRef.current?.id);
      });

      socketRef.current.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
      });

      socketRef.current.on('connect_error', (err: any) => {
        console.error('Socket connection error:', err);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // 3. Handle incoming messages
  useEffect(() => {
    if (!socketRef.current) return;

    const handleReceiveMessage = (message: MessageType) => {
      if (message && message.concernId) {
        const commentId = message.id || uuidv4();

        setConcerns(prevConcerns => {
          return prevConcerns.map(concern => {
            if (concern.id === message.concernId) {
              const newComment: CommentType = {
                id: commentId,
                text: message.message,
                author: message.sender,
                timestamp: message.timestamp || new Date().toISOString()
              };

              // Check if we already have this message
              if (!concern.comments.find(c => c.id === newComment.id)) {
                return {
                  ...concern,
                  comments: [...concern.comments, newComment]
                };
              }
            }
            return concern;
          });
        });
      }
    };

    socketRef.current.on('receive_message', handleReceiveMessage);

    return () => {
      socketRef.current?.off('receive_message', handleReceiveMessage);
    };
  }, []);

  // 4. Join room when selected concern changes
  useEffect(() => {
    if (!selectedConcernId || !socketRef.current) return;

    socketRef.current.emit('join_room', {
      concernId: selectedConcernId,
      userId: 'company'
    });

    return () => {
      socketRef.current?.emit('leave_room', {
        concernId: selectedConcernId,
        userId: 'company'
      });
    };
  }, [selectedConcernId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedConcernId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [concerns, selectedConcernId]);

  // Handle concern selection
  const handleSelectConcern = (id: string) => {
    if (!id) return;
    setSelectedConcernId(id);
  };

  // Send new comment
  const handleAddComment = () => {
    if (!newComment.trim() || !selectedConcernId || !socketRef.current) return;

    const commentId = uuidv4();
    const timestamp = new Date().toISOString();

    const newCommentObj: CommentType = {
      id: commentId,
      text: newComment,
      author: 'company',
      timestamp: timestamp
    };

    socketRef.current.emit('send_message', {
      concernId: selectedConcernId,
      message: newComment,
      sender: 'company',
      id: commentId,
      timestamp: timestamp
    });

    // Optimistic UI update
    setConcerns(prev =>
      prev.map(concern =>
        concern.id === selectedConcernId
          ? { ...concern, comments: [...concern.comments, newCommentObj] }
          : concern
      )
    );

    setNewComment('');
  };

  // Get selected concern data
  const selectedConcern: ConcernType = concerns.find(c => c.id === selectedConcernId) || {
    id: "",
    title: "",
    organization: "",
    status: "",
    date: "",
    comments: []
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Side - Chat Section */}
      <div className="w-2/3 p-6 flex flex-col h-full border-r">
        <h1 className="text-2xl font-bold mb-4">Organization Dashboard</h1>

        {/* Chat Interface */}
        {selectedConcernId ? (
          <div className="flex flex-col flex-grow bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Chat Header */}
            <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">
                  {selectedConcern?.title || selectedConcern?.organization || `Concern #${selectedConcernId}`}
                </h2>
                <p className="text-sm text-gray-500">Status: {selectedConcern?.status || "Unknown"}</p>
              </div>

              {/* Refresh button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetch('http://localhost:5000/api/concerns')
                    .then(res => res.json())
                    .then((data: any[]) => {
                      const processedData: ConcernType[] = data.map(concern => ({
                        ...concern,
                        id: concern.id || uuidv4(),
                        comments: Array.isArray(concern.comments) ? concern.comments.map((comment: any) => ({
                          ...comment,
                          id: comment.id || uuidv4()
                        })) : []
                      }));
                      setConcerns(processedData.reverse());
                    })
                    .catch(error => console.error("Failed to fetch concerns:", error));
                }}
              >
                Refresh
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {(selectedConcern.comments || []).map((comment: CommentType) => (
                <div
                  key={comment.id}
                  className={`max-w-3/4 rounded-lg p-3 ${
                    comment.author === 'company'
                      ? 'bg-blue-100 ml-auto'
                      : 'bg-gray-100'
                  }`}
                >
                  <p className="text-sm">{comment.text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {comment.author || "Unknown"} | {formatTimestamp(comment.timestamp)}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-3 border-t flex gap-2">
              <Input
                type="text"
                placeholder="Type your message..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                className="flex-grow"
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>Send</Button>
            </div>
          </div>
        ) : (
          <div className="flex-grow flex items-center justify-center bg-white rounded-lg">
            <p className="text-gray-500">Select a concern from the list to start chatting</p>
          </div>
        )}
      </div>

      {/* Right Side - Concerns List */}
      <div className="w-1/3 p-6 bg-gray-100 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Active Concerns</h2>

        {/* Concerns List - Vertical */}
        <div className="space-y-3">
          {concerns.map((concern) => (
            <Card
              key={concern.id}
              onClick={() => handleSelectConcern(concern.id)}
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                selectedConcernId === concern.id ? 'border-2 border-blue-500' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="font-semibold text-base">
                      {concern.title || concern.organization || "Unnamed Concern"}
                    </h2>
                    <p className="text-sm text-gray-600">ID: {concern.id || "Unknown"}</p>
                    <p className="text-sm text-gray-600">Date: {concern.date || "Unknown"}</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                      concern.status === 'Open' ? 'bg-green-500' :
                      concern.status === 'Pending' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}></span>
                    <span className="text-sm">{concern.status || "Unknown"}</span>
                  </div>
                </div>

                {/* Comment count badge */}
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {concern.comments?.length || 0} messages
                  </span>
                  {concern.comments?.length > 0 && (
                    <span className="text-xs text-gray-500">
                      Last update: {formatTimestamp(concern.comments[concern.comments.length - 1]?.timestamp)}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {concerns.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No concerns available</p>
            </div>
          )}
        </div>

        {/* Details section */}
        {selectedConcernId && (
          <div className="mt-6">
            <h3 className="font-semibold text-lg mb-2">Selected Concern Details</h3>
            <Card className="bg-white">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">ID</h3>
                    <p>{selectedConcern && selectedConcern.id ? selectedConcern.id : "Unknown"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Organization</h3>
                    <p>{selectedConcern && selectedConcern.organization ? selectedConcern.organization : "Unknown"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <p className="font-medium">
                      <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        selectedConcern?.status === 'Open' ? 'bg-green-500' :
                        selectedConcern?.status === 'Pending' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></span>
                      {selectedConcern && selectedConcern.status ? selectedConcern.status : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date Submitted</h3>
                    <p>{selectedConcern && selectedConcern.date ? selectedConcern.date : "Unknown"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
