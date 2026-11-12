import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined'
import SlideshowOutlinedIcon from '@mui/icons-material/SlideshowOutlined'
import { type AttachmentKind, attachmentKindLabels } from '../../data/attachments'

const icons: Record<AttachmentKind, typeof ImageOutlinedIcon> = {
    photo: ImageOutlinedIcon,
    pdf: PictureAsPdfOutlinedIcon,
    word: DescriptionOutlinedIcon,
    powerpoint: SlideshowOutlinedIcon,
}

/** A small icon for the kind of file, coloured by kind, named for readers. */
export const FileKindIcon = ({ kind }: { kind: AttachmentKind }) => {
    const Icon = icons[kind]
    return (
        <span className={`file-kind file-kind-${kind}`}>
            <Icon
                fontSize="small"
                titleAccess={attachmentKindLabels[kind].replace(/s$/, '')}
            />
        </span>
    )
}
