import { useEffect, useState } from 'react'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import SlideshowOutlinedIcon from '@mui/icons-material/SlideshowOutlined'
import type { Attachment, AttachmentKind } from '../../data/attachments'
import { thumbnailUrl } from '../../onedrive/graph'

const icons: Record<AttachmentKind, typeof ImageOutlinedIcon> = {
    photo: ImageOutlinedIcon,
    pdf: PictureAsPdfOutlinedIcon,
    word: DescriptionOutlinedIcon,
    powerpoint: SlideshowOutlinedIcon,
}

/** The icon for a kind of file. */
export const FileKindIcon = ({ kind }: { kind: AttachmentKind }) => {
    const Icon = icons[kind]
    return <Icon fontSize="small" aria-hidden="true" />
}

/**
 * OneDrive's thumbnail, as a plain `<img src>` — the thumbnail host refuses
 * fetch() under CORS but serves images fine. Falls back to the kind's icon
 * while loading, or when OneDrive has none.
 */
export const FileThumb = ({ attachment }: { attachment: Attachment }) => {
    const [url, setUrl] = useState<string | null>(null)
    const [failed, setFailed] = useState(false)

    useEffect(() => {
        let live = true
        thumbnailUrl(attachment.driveItemId)
            .then((value) => live && setUrl(value))
            .catch(() => live && setUrl(null))
        return () => {
            live = false
        }
    }, [attachment.driveItemId])

    return (
        <span className="file-thumb">
            {url && !failed ? (
                <img
                    src={url}
                    alt=""
                    loading="lazy"
                    onError={() => setFailed(true)}
                />
            ) : (
                <FileKindIcon kind={attachment.kind} />
            )}
        </span>
    )
}
