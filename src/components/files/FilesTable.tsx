import { Link } from 'react-router-dom'
import { IconButton, Tooltip } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineRounded'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import { formatBytes } from '../../data/attachments'
import { downloadAttachment } from '../../onedrive/attach'
import {
    classLinkFor,
    type FileGroup,
    shortDate,
    whoFor,
} from '../../utils/classFiles'
import { FileKindIcon } from './FileKindIcon'

type Props = {
    groups: FileGroup[]
    /** Opens the viewer on the file at this position. */
    onPreview: (index: number) => void
    /** The Class files page: who, subject, day and a way to the class. */
    withClass?: boolean
    /** Off on a student's own page, where "who" is a given. */
    showStudent?: boolean
    /** The class dialog: remove a file (every student's copy). */
    onRemove?: (group: FileGroup) => void
    removingKey?: string | null
}

/**
 * Files as a table (owner call, 2026-11-12): a small icon for the kind, the
 * name with its caption, and Preview / Download on every row. The same table
 * serves the class dialog (compact, with Remove) and the Class files page
 * (with student, subject, day and the way back to the class).
 */
export const FilesTable = ({
    groups,
    onPreview,
    withClass = false,
    showStudent = true,
    onRemove,
    removingKey = null,
}: Props) => (
    <div className="table-wrapper">
        <table
            className={`files-table ${withClass ? 'with-class' : ''}`.trim()}
        >
            <thead>
                <tr>
                    <th scope="col">
                        <span className="visually-hidden">Type</span>
                    </th>
                    <th scope="col">File</th>
                    {withClass && showStudent && <th scope="col">Student</th>}
                    {withClass && (
                        <th scope="col" className="col-optional">
                            Subject
                        </th>
                    )}
                    {withClass && <th scope="col">Class</th>}
                    <th scope="col" className="col-optional">
                        Size
                    </th>
                    <th scope="col">
                        <span className="visually-hidden">Actions</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                {groups.map((group, index) => (
                    <tr key={group.key}>
                        <td className="files-table-kind">
                            <FileKindIcon kind={group.file.kind} />
                        </td>
                        <td className="files-table-name">
                            <button
                                type="button"
                                className="files-table-open"
                                onClick={() => onPreview(index)}
                            >
                                {group.file.fileName}
                            </button>
                            {group.file.caption && (
                                <small>{group.file.caption}</small>
                            )}
                            {!withClass && group.copies.length > 1 && (
                                <small>
                                    Copy for each of {group.copies.length}{' '}
                                    students
                                </small>
                            )}
                        </td>
                        {withClass && showStudent && <td>{whoFor(group)}</td>}
                        {withClass && (
                            <td className="col-optional">
                                {group.file.subject}
                            </td>
                        )}
                        {withClass && (
                            <td className="files-table-date">
                                <Link to={classLinkFor(group.file)}>
                                    {shortDate(group.file.date)}
                                </Link>
                            </td>
                        )}
                        <td className="col-optional files-table-size">
                            {formatBytes(group.file.sizeBytes)}
                        </td>
                        <td className="files-table-actions">
                            <Tooltip title="Preview">
                                <IconButton
                                    size="small"
                                    aria-label={`Preview ${group.file.fileName}`}
                                    onClick={() => onPreview(index)}
                                >
                                    <VisibilityOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                                <IconButton
                                    size="small"
                                    aria-label={`Download ${group.file.fileName}`}
                                    onClick={() =>
                                        void downloadAttachment(group.file)
                                    }
                                >
                                    <DownloadOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            {onRemove && (
                                <Tooltip title="Remove">
                                    <span>
                                        <IconButton
                                            size="small"
                                            aria-label={`Remove ${group.file.fileName}`}
                                            disabled={removingKey === group.key}
                                            onClick={() => onRemove(group)}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)
