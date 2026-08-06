import type { SvgIconComponent } from '@mui/icons-material'
import FunctionsRoundedIcon from '@mui/icons-material/FunctionsRounded'
import BoltRoundedIcon from '@mui/icons-material/BoltRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import BiotechRoundedIcon from '@mui/icons-material/BiotechRounded'
import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'

/**
 * A subject-appropriate glyph; a book stands in for anything unrecognised.
 * Shared by the Offerings cards and the Home hero's subject chips, so a
 * subject always wears the same icon everywhere.
 */
export const subjectIcon = (name: string): SvgIconComponent =>
    ({
        Mathematics: FunctionsRoundedIcon,
        Physics: BoltRoundedIcon,
        Chemistry: ScienceRoundedIcon,
        Biology: BiotechRoundedIcon,
    })[name] ?? MenuBookRoundedIcon
