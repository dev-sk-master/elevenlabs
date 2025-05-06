import React, { useState, useRef, useEffect, useCallback } from 'react';
import moment from 'moment';
import ReactAudioPlayer from 'react-audio-player';
import ContentEditable from 'react-contenteditable';



const TranscriptionItemOwner = React.memo(({ item, idx, handleMouseEnter, handleMouseLeave, activeColumn, isMobile, hoveredIndex, room, cleanHtml, createAudioUrl, formData, handleModeration, handleTextEdit, handleMergeCheck, mergeChecks }) => {
    //console.log('render TranscriptionItemOwner', idx)
    // useEffect(() => {
    //     console.log('inside render TranscriptionItemOwner', idx)
    // }, [])
    return (
        <div className="row gx-3 mb-2" key={`transcription-row-${item.uuid}`} onMouseEnter={() => handleMouseEnter(idx)} /*onMouseLeave={handleMouseLeave}*/>
            <div className={`col-12 col-md-6 d-flex ${(activeColumn === 0 || !isMobile) ? 'd-block' : 'd-none'}`}>
                <div
                    key={`transcription-${item.uuid}`}
                    className={`flex-fill p-2 mb-2 border rounded position-relative ${hoveredIndex === idx ? 'bg-light shadow-sm' : ''} ${item.status === 'failed' ? 'border-danger' : ''}`}
                    style={{ transition: 'background-color 0.2s ease-in-out' }}
                >

                    <div className='d-flex justify-content-between align-items-center mb-1'>
                        <small className="text-muted">{moment(item.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').format('HH:mm:ss')}</small>
                        {/* Status Indicators */}
                        <span>
                            {item.segmentCutoff && <span className="badge bg-warning text-dark me-1">1m Cutoff</span>}
                            {item.status === 'listening' && <span className="badge bg-info me-1">Listening...</span>}
                            {item.status === 'processing' && <span className="badge bg-info me-1">Processing...</span>}
                            {item.status === 'reprocessing' && <span className="badge bg-warning text-dark me-1">Reprocessing...</span>}
                            {item.status === 'failed' && <span className="badge bg-danger me-1">Failed</span>}
                            {item.status == 'completed' && item.moderation_status === 'rejected' && <span className="badge bg-danger me-1">Rejected</span>}
                            {item.status == 'completed' && item.moderation_status === 'pending' && formData.moderation && <span className="badge bg-secondary me-1">Pending</span>}
                        </span>
                    </div>

                    <div
                        contentEditable={room.role === 'owner' && item.status == 'completed' && item.moderation_status == 'pending'}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => { if (room.role === 'owner' && item.status == 'completed') handleTextEdit(item.uuid, 'transcription', e.target.innerText || '') }}
                        className={`editable-text p-1 ${room.role === 'owner' ? 'form-control-plaintext' : ''}`}
                        style={{ minHeight: '1.5em', whiteSpace: 'pre-line' }}
                        dangerouslySetInnerHTML={{ __html: cleanHtml(item.text) }}
                    >
                        {/* {cleanHtml(item.text)} */}
                        {item.error ? <span className='text-danger'>{item.error}</span> : null}
                    </div>

                    {/* Individual Audio Player (uses segment chunks) */}
                    {/* {hoveredIndex === idx && item.audio?.chunks?.length > 0 && item.audio?.mimeType && ( */}
                    <div className={`mt-2 border-top pt-2 collapse ${hoveredIndex === idx && item.audio?.chunks?.length > 0 && item.audio?.mimeType ? 'show' : ''}`}>
                        {(() => {
                            const audioUrl = createAudioUrl(item.audio.chunks, item.audio.mimeType);
                            if (!audioUrl) return <small className="text-danger">Could not load audio preview.</small>;
                            return (<><ReactAudioPlayer
                                key={audioUrl}
                                src={audioUrl}
                                controls
                                preload="none" // Don't preload segment previews
                                style={{ height: '40px', width: '100%' }}
                                onError={(e) => console.error("Individual audio error", e)}
                            //onCanPlay={e => { if (e.target.src) URL.revokeObjectURL(e.target.src); }} // Attempt cleanup
                            //onAbort={e => { if (e.target.src) URL.revokeObjectURL(e.target.src); }} // Attempt cleanup
                            />
                                <a
                                    href={audioUrl}
                                    // Construct filename using stored mimeType
                                    download={`audio_recording_${room.roomId}_${Date.now()}.${item.audio.mimeType?.split(';')[0]?.split('/')[1] || 'webm'}`}
                                    className="btn btn-sm btn-outline-secondary mt-2"
                                >
                                    <i className="bi bi-download me-1"></i> Download Audio
                                </a>
                            </>);
                        })()}
                        {/* MimeType: {item.audio.mimeType} */}
                    </div>
                    {/* )} */}
                </div>
            </div>
            <div className={`col-12 col-md-6 d-flex ${(activeColumn === 1 || !isMobile) ? 'd-block' : 'd-none'}`}>
                <div
                    key={`translation-${item.uuid}`}
                    onMouseEnter={() => handleMouseEnter(idx)}
                    className={`flex-fill p-2 mb-2 border rounded position-relative ${hoveredIndex === idx ? 'bg-light shadow-sm' : ''} ${item.translate?.status === 'failed' ? 'border-danger' : ''}`}
                    style={{ transition: 'background-color 0.2s ease-in-out', minHeight: '5em' /* Ensure consistent height */ }}
                >
                    {room.role === 'owner' && (
                        <div className='d-flex justify-content-between align-items-center mb-1'>
                            <small className="text-muted">{moment(item.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').format('HH:mm:ss')}</small>
                            {/* Status Indicators */}
                            <span>
                                {item.translate?.segmentCutoff && <span className="badge bg-warning text-dark me-1">1m Cutoff</span>}
                                {!item.translate && <span className="badge bg-info me-1">Pending...</span>}
                                {item.translate?.status === 'processing' && <span className="badge bg-info me-1">Translating...</span>}
                                {item.translate?.status === 'reprocessing' && <span className="badge bg-warning text-dark me-1">Retranslating...</span>}
                                {item.translate?.status === 'failed' && <span className="badge bg-danger me-1">Failed</span>}
                            </span>
                        </div>
                    )}

                    <div
                        contentEditable={room.role === 'owner' && item.translate?.status === 'completed' && item.moderation_status == 'pending'}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => { if (room.role === 'owner' && item.translate?.status === 'completed') handleTextEdit(item.uuid, 'translation', e.target.innerText || '') }}
                        className={`editable-text p-1 ${room.role === 'owner' ? 'form-control-plaintext' : ''}`}
                        style={{ minHeight: '1.5em', whiteSpace: 'pre-line' }}
                        dangerouslySetInnerHTML={{ __html: cleanHtml(item.translate?.text) }}
                    >
                        {/* {cleanHtml(item.translate?.text)} */}
                        {item.translate?.error ? <span className='text-danger'>{item.translate.error}</span> : null}
                    </div>



                    {/* Moderation Controls on Hover (Owner Only) */}
                    {/* {room.role === 'owner' && hoveredIndex === idx && formData.moderation && item.translate?.status === 'completed' && ['pending', 'approved', 'rejected'].includes(item.moderation_status) && ( */}
                    <div className={`mt-2 pt-2 border-top text-center moderation-controls collapse ${room.role === 'owner' && hoveredIndex === idx && formData.moderation && item.translate?.status === 'completed' && ['pending', /*'approved', 'rejected'*/].includes(item.moderation_status) ? 'show' : ''}`}>
                        <div className="form-check me-2" style={{ display: 'inline-block' }}>
                            <input className="form-check-input" type="checkbox"
                                checked={mergeChecks.includes(item.uuid)}
                                onChange={() => handleMergeCheck(item.uuid)}
                            />
                            <label className="form-check-label text-muted" >
                                Merge item
                            </label>
                        </div>

                        <small className='text-muted me-2'>Moderation:</small>
                        <div className="btn-group btn-group-sm" role="group">
                            <button type="button" className={`btn ${item.moderation_status === 'approved' ? 'btn-success' : 'btn-outline-success'}`} onClick={() => handleModeration(item.uuid, 'approved')} disabled={item.moderation_status === 'approved'}>Approve</button>
                            <button type="button" className={`btn ${item.moderation_status === 'rejected' ? 'btn-danger' : 'btn-outline-danger'}`} onClick={() => handleModeration(item.uuid, 'rejected')} disabled={item.moderation_status === 'rejected'}>Reject</button>
                            {/* {item.moderation_status !== 'pending' && (
                    <button type="button" className="btn btn-outline-secondary" onClick={() => handleModeration(item.uuid, 'pending')}>Reset</button>
                  )} */}
                        </div>
                    </div>
                    {/*} )}*/}
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        JSON.stringify(prevProps.item) === JSON.stringify(nextProps.item) &&
        prevProps.idx === nextProps.idx &&
        prevProps.hoveredIndex === nextProps.hoveredIndex &&
        prevProps.activeColumn === nextProps.activeColumn &&
        //prevProps.isMobile === nextProps.isMobile &&
        JSON.stringify(prevProps.mergeChecks) === JSON.stringify(nextProps.mergeChecks) &&
        //prevProps.room === nextProps.room &&
        JSON.stringify({ moderation: prevProps.formData.moderation, moderation_status: prevProps.formData.moderation_status }) === JSON.stringify({ moderation: nextProps.formData.moderation, moderation_status: nextProps.formData.moderation_status })
    );
});


export default TranscriptionItemOwner;