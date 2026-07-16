import { Skeleton } from '@mui/material'

/**
 * Skeleton stand-in for a data-driven screen while its slice loads. Refreshing
 * used to flash every screen's zero state — empty charts, "0 students" — for
 * the moment before the API answered; a page-shaped placeholder reads as
 * "coming" rather than "broken".
 */
export const PageLoading = () => (
    <section className="content-stack" aria-busy="true" aria-label="Loading">
        <div className="card">
            <Skeleton variant="text" width="30%" height={36} />
            <Skeleton variant="text" width="55%" />
        </div>
        <div className="page-loading-tiles">
            {[0, 1, 2, 3].map((tile) => (
                <div className="card" key={tile}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="rounded" height={56} />
                </div>
            ))}
        </div>
        <div className="card">
            <Skeleton variant="rounded" height={220} />
        </div>
    </section>
)
