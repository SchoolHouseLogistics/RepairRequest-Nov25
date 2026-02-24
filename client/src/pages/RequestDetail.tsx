import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, FileText, Download } from "lucide-react";
import StatusBadge from "@/components/status/StatusBadge";
import PriorityBadge from "@/components/priority/PriorityBadge";
import RequestTimeline from "@/components/requests/RequestTimeline";
import MessageThread from "@/components/requests/MessageThread";
import AdminActions from "@/components/requests/AdminActions";
import { format } from "date-fns";
import { useEffect, useState } from "react"

interface RequestDetailProps {
  id: string;
}

export default function RequestDetail({ id }: RequestDetailProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const requestId = parseInt(id);

  const { data: request, isLoading, error } = useQuery({
    queryKey: [`/api/requests/${requestId}`],
  });

  const { data: timeline, isLoading: isLoadingTimeline } = useQuery({
    queryKey: [`/api/requests/${requestId}/timeline`],
  });

  const { data: photos, isLoading: isLoadingPhotos } = useQuery({
    queryKey: [`/api/requests/${requestId}/photos`],
  });

  const showAdminActions = user?.role === 'admin' || user?.role === 'maintenance';

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-6">
            <Button variant="ghost" className="mr-3" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={20} />
            </Button>
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg animate-pulse">
            <div className="h-96"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="flex items-center mb-6">
            <Button variant="ghost" className="mr-3" onClick={() => navigate("/dashboard")}>
              <ArrowLeft size={20} />
            </Button>
            <h1 className="text-2xl font-heading font-bold text-gray-900">Request Not Found</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p>The requested maintenance request could not be found or you do not have permission to view it.</p>
              <Button className="mt-4" onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Helper to extract S3 key from a full S3 URL
  function extractS3Key(url: string) {
    const prefix = "https://repair-request-121905340783.s3.eu-north-1.amazonaws.com/";
    return url && url.startsWith(prefix) ? url.slice(prefix.length) : url;
  }

  function S3Image({ s3Key, alt }: { s3Key: string, alt?: string }) {
    const [url, setUrl] = useState(null);

    useEffect(() => {
      fetch(`/get-presigned-url?key=${encodeURIComponent(s3Key)}`)
        .then(res => res.json())
        .then(data => setUrl(data.url));
    }, [s3Key]);

    if (!url) return <div>Loading...</div>;
    return <img src={url} alt="From S3" />;
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex items-center">
          <Button variant="ghost" className="mr-3 text-primary p-2" onClick={() => navigate("/dashboard")}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Request Details</h1>
        </div>

        <Card>
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <div>
              <h2 className="text-xl font-heading font-medium text-gray-900">{request.event}</h2>
              <p className="text-sm text-gray-500">Request #{request.id}</p>
            </div>
            <div className="flex space-x-2">
              <StatusBadge status={request.status} />
              <PriorityBadge priority={request.priority || 'medium'} />
            </div>
          </CardHeader>

          <CardContent>
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 -mx-6">
                <dt className="text-sm font-medium text-gray-500">Building</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{request.facility}</dd>
              </div>

              <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 -mx-6">
                <dt className="text-sm font-medium text-gray-500">Date</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {request.eventDate ? format(new Date(request.eventDate), 'MMMM d, yyyy') : 'Not specified'}
                </dd>
              </div>

              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 -mx-6">
                <dt className="text-sm font-medium text-gray-500">Time</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:gap-4">
                    {request.setupTime && (
                      <div>
                        <span className="font-medium">Setup:</span> {request.setupTime}
                      </div>
                    )}
                    {request.startTime && (
                      <div>
                        <span className="font-medium">Start:</span> {request.startTime}
                      </div>
                    )}
                    {request.endTime && (
                      <div>
                        <span className="font-medium">End:</span> {request.endTime}
                      </div>
                    )}
                    {!request.setupTime && !request.startTime && !request.endTime && (
                      <div>Not specified</div>
                    )}
                  </div>
                </dd>
              </div>

              <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 -mx-6">
                <dt className="text-sm font-medium text-gray-500">Requestor</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {request.requestor?.name || 'Unknown'}
                </dd>
              </div>

              {/* For Facilities Requests - Show items */}
              {request.requestType === 'facilities' && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 -mx-6">
                  <dt className="text-sm font-medium text-gray-500">Items Requested</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <ul className="border border-gray-200 rounded-md divide-y divide-gray-200">
                      {request.items?.chairsAudience && (
                        <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="material-icons text-gray-400 mr-2">check_circle</span>
                            <span className="flex-1 w-0 truncate">
                              Chairs for audience ({request.items.chairsAudienceQty || 'Quantity not specified'})
                            </span>
                          </div>
                        </li>
                      )}

                      {request.items?.chairsStage && (
                        <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="material-icons text-gray-400 mr-2">check_circle</span>
                            <span className="flex-1 w-0 truncate">
                              Chairs for stage ({request.items.chairsStageQty || 'Quantity not specified'})
                            </span>
                          </div>
                        </li>
                      )}

                      {request.items?.podium && (
                        <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="material-icons text-gray-400 mr-2">check_circle</span>
                            <span className="flex-1 w-0 truncate">
                              Podium {request.items.podiumSound ? 'with sound' : 'without sound'}
                              {request.items.podiumLocation ? ` (${request.items.podiumLocation})` : ''}
                            </span>
                          </div>
                        </li>
                      )}

                      {request.items?.audioVisual && (
                        <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="material-icons text-gray-400 mr-2">check_circle</span>
                            <span className="flex-1 w-0 truncate">
                              Microphone/AV Equipment
                            </span>
                          </div>
                        </li>
                      )}

                      {request.items?.avOther && (
                        <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="material-icons text-gray-400 mr-2">check_circle</span>
                            <span className="flex-1 w-0 truncate">
                              Other AV needs: {request.items.avOtherSpec || 'Not specified'}
                            </span>
                          </div>
                        </li>
                      )}

                      {request.items?.tables && (
                        <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="material-icons text-gray-400 mr-2">check_circle</span>
                            <span className="flex-1 w-0 truncate">
                              Tables ({request.items.tablesQty || 'Quantity not specified'})
                              {request.items.tablesLocation ? ` (${request.items.tablesLocation})` : ''}
                            </span>
                          </div>
                        </li>
                      )}

                      {request.items?.lighting && (
                        <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="material-icons text-gray-400 mr-2">check_circle</span>
                            <span className="flex-1 w-0 truncate">
                              Lighting
                            </span>
                          </div>
                        </li>
                      )}

                      {request.items?.food && (
                        <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="material-icons text-gray-400 mr-2">check_circle</span>
                            <span className="flex-1 w-0 truncate">
                              Food (Catering)
                            </span>
                          </div>
                        </li>
                      )}

                      {request.items?.cleanup && (
                        <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                          <div className="w-0 flex-1 flex items-center">
                            <span className="material-icons text-gray-400 mr-2">check_circle</span>
                            <span className="flex-1 w-0 truncate">
                              Clean up crew after event
                            </span>
                          </div>
                        </li>
                      )}

                      {!request.items?.chairsAudience &&
                        !request.items?.chairsStage &&
                        !request.items?.podium &&
                        !request.items?.audioVisual &&
                        !request.items?.avOther &&
                        !request.items?.tables &&
                        !request.items?.lighting &&
                        !request.items?.food &&
                        !request.items?.cleanup && (
                          <li className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                            <div className="w-0 flex-1 flex items-center">
                              <span className="flex-1 w-0 truncate">
                                No specific items requested
                              </span>
                            </div>
                          </li>
                        )}
                    </ul>
                  </dd>
                </div>
              )}

              {/* For Building Requests - Show building details */}
              {request.requestType === 'building' && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 -mx-6">
                  <dt className="text-sm font-medium text-gray-500">Building Details</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="space-y-4">
                      <div>
                        <span className="font-medium">Building:</span> {request.buildingDetails?.building || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Room Number:</span> {request.buildingDetails?.roomNumber || 'Not specified'}
                      </div>
                      <div>
                        <span className="font-medium">Description:</span>
                        <p className="mt-1">{request.buildingDetails?.description || 'No description provided'}</p>
                      </div>
                    </div>
                  </dd>
                </div>
              )}

              {/* For Tech Requests - Show tech details */}
              {request.requestType === 'tech' && request.techDetails && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 -mx-6">
                  <dt className="text-sm font-medium text-gray-500">Tech Details</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="space-y-3">
                      {request.techDetails.category && (
                        <div>
                          <span className="font-medium">Category:</span>{" "}
                          <span className="capitalize">{request.techDetails.category}</span>
                        </div>
                      )}
                      {request.techDetails.deviceType && (
                        <div>
                          <span className="font-medium">Device Type:</span>{" "}
                          <span className="capitalize">{request.techDetails.deviceType}</span>
                        </div>
                      )}
                      {request.techDetails.deviceLocation && (
                        <div>
                          <span className="font-medium">Device Location:</span>{" "}
                          {request.techDetails.deviceLocation}
                        </div>
                      )}
                      {request.techDetails.assetTag && (
                        <div>
                          <span className="font-medium">Asset Tag:</span>{" "}
                          {request.techDetails.assetTag}
                        </div>
                      )}
                      {request.techDetails.description && (
                        <div>
                          <span className="font-medium">Description:</span>
                          <p className="mt-1">{request.techDetails.description}</p>
                        </div>
                      )}
                      {request.techDetails.errorMessage && (
                        <div>
                          <span className="font-medium">Error Message:</span>
                          <pre className="mt-1 text-xs bg-gray-100 rounded p-2 whitespace-pre-wrap font-mono">
                            {request.techDetails.errorMessage}
                          </pre>
                        </div>
                      )}
                      {request.techDetails.stepsToReproduce && (
                        <div>
                          <span className="font-medium">Steps to Reproduce:</span>
                          <p className="mt-1">{request.techDetails.stepsToReproduce}</p>
                        </div>
                      )}
                      {request.techDetails.urgencyReason && (
                        <div>
                          <span className="font-medium">Urgency Reason:</span>{" "}
                          {request.techDetails.urgencyReason}
                        </div>
                      )}
                    </div>
                  </dd>
                </div>
              )}

              {request.items?.otherNeeds && (
                <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 -mx-6">
                  <dt className="text-sm font-medium text-gray-500">Other Notes</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {request.items.otherNeeds}
                  </dd>
                </div>
              )}

              {request.assignee && (
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 -mx-6">
                  <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-2">
                        <span className="text-white font-heading font-medium text-sm">
                          {request.assignee.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <span>{request.assignee.name}</span>
                    </div>
                  </dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Photos Section - Only visible for building requests */}
        {request?.requestType === 'building' && (
          <div className="mt-8">
            <h2 className="text-lg font-heading font-medium text-gray-900 mb-4">Attached Photos</h2>
            <Card>
              <CardContent className="p-4">
                {isLoadingPhotos ? (
                  <div className="py-4 text-center text-gray-500">Loading photos...</div>
                ) : photos && photos.length > 0 ? (
                  <>
                    {/* Photo Gallery Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {photos.map((photo: any) => (
                        <div
                          key={photo.id}
                          className="group relative rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="aspect-video w-full bg-gray-100">
                            {/* S3Image integration for displaying S3 photos */}
                            {(() => {
                              const key = photo.filename && photo.filename.startsWith("http")
                                ? extractS3Key(photo.filename)
                                : `requests/${request.id}/${photo.filename}`;
                              console.log("S3Key for photo", photo, ":", key);
                              return (
                                <S3Image
                                  s3Key={key}
                                  alt={photo.originalFilename || "Maintenance request photo"}
                                />
                              );
                            })()}

                            {/* Old <img> tag replaced above. Error handling for unavailable images should be handled in S3Image. */}
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-medium">
                              {photo.originalFilename || "Maintenance photo"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {photo.uploadedAt ?
                                (() => {
                                  try {
                                    return format(new Date(photo.uploadedAt), 'MMM d, yyyy')
                                  } catch (e) {
                                    return 'Date unavailable'
                                  }
                                })() :
                                'Date unavailable'
                              }
                            </p>
                          </div>
                          <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <a
                              href={photo.photoUrl ? `/${photo.photoUrl}` : (photo.filename ? `/uploads/photos/${photo.filename}` : '')}
                              download={photo.originalFilename}
                              className="bg-primary text-white p-2 rounded-full inline-flex"
                              title="Download photo"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Photo List View */}
                    <h3 className="text-sm font-medium text-gray-700 mb-2">All Attached Files</h3>
                    <div className="border rounded-md divide-y">
                      {photos.map((photo: any) => (
                        <div key={`list-${photo.id}`} className="flex items-center p-3 hover:bg-slate-50">
                          <FileText className="h-5 w-5 mr-3 text-slate-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {photo.originalFilename || photo.filename || "Photo"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {photo.uploadedAt ?
                                (() => {
                                  try {
                                    return format(new Date(photo.uploadedAt), 'MMM d, yyyy')
                                  } catch (e) {
                                    return 'Date unavailable'
                                  }
                                })() :
                                'Date unavailable'
                              }
                            </p>
                          </div>
                          <a
                            href={photo.photoUrl ? `/${photo.photoUrl}` : (photo.filename ? `/uploads/photos/${photo.filename}` : '')}
                            download={photo.originalFilename}
                            className="ml-auto"
                          >
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                          </a>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center text-gray-500">No photos attached to this request</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Status Timeline */}
        <div className="mt-8">
          <h2 className="text-lg font-heading font-medium text-gray-900 mb-4">Request Timeline</h2>
          <RequestTimeline timeline={timeline} isLoading={isLoadingTimeline} />
        </div>

        {/* Communication Thread */}
        <div className="mt-8">
          <h2 className="text-lg font-heading font-medium text-gray-900 mb-4">Communication</h2>
          <MessageThread requestId={requestId} />
        </div>

        {/* Admin Actions - Only visible to maintenance staff and admins */}
        {showAdminActions && (
          <div className="mt-8">
            <h2 className="text-lg font-heading font-medium text-gray-900 mb-4">Administrative Actions</h2>
            <AdminActions requestId={requestId} request={request} />
          </div>
        )}
      </div>
    </div>
  );
}
