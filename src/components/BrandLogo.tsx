/**
 * The AbhiTutor lockup (REQ-035): "Abhi" signed in Alex Brush, "Tutor"
 * upright in Inter 800, the green fountain-pen ink mark tucked beneath, and
 * — in the full form — the slim pen resting after the name, nib pointing
 * back at the word it wrote. Colours ride the brand CSS variables, so every
 * theme (and the sidebar's band) renders it correctly.
 *
 * Size scales from the parent's font-size: the wordmark is set in em.
 */
export const BrandLogo = ({ pen = true }: { pen?: boolean }) => (
    <span className="brand-logo">
        <span className="brand-wordline">
            <span className="brand-abhi">Abhi</span>
            <span className="brand-tutor">Tutor</span>
            {pen && (
                <svg
                    className="brand-pen"
                    width="38"
                    height="28"
                    viewBox="0 0 54 40"
                    aria-hidden
                >
                    <g transform="translate(4,32) rotate(-38)">
                        {/* Barrel in the surrounding text colour. */}
                        <rect
                            x="16.6"
                            y="-4.2"
                            width="31"
                            height="8.4"
                            rx="3.8"
                            fill="currentColor"
                        />
                        {/* The green nib, its slit and breather hole. */}
                        <path
                            d="M0 0 C 3.8 -3, 7.6 -3.7, 11 -3.4 L11 2.4 C 7.2 3, 3.6 2.3, 0 0 Z"
                            fill="#22c55e"
                        />
                        <line
                            x1="1.6"
                            y1="-0.2"
                            x2="8.4"
                            y2="-0.6"
                            stroke="#15803d"
                            strokeWidth="0.8"
                        />
                        <circle
                            cx="8.6"
                            cy="-0.6"
                            r="1"
                            fill="none"
                            stroke="#15803d"
                            strokeWidth="0.8"
                        />
                        {/* Green grip, band and clip. */}
                        <rect x="11" y="-3.9" width="5.6" height="7.4" rx="1.2" fill="#15803d" />
                        <rect x="36.5" y="-4.7" width="2.6" height="9.4" rx="1.1" fill="#22c55e" />
                        <rect x="39" y="-7.6" width="9.5" height="2.2" rx="1.1" fill="#22c55e" />
                    </g>
                </svg>
            )}
        </span>
        {/* The ink mark: hairline in, a pressured swell, a fine tail, and the
            pool where the nib first touched down. */}
        <svg
            className="brand-mark"
            width="120"
            height="11"
            viewBox="0 0 175 16"
            aria-hidden
        >
            <path d="M4 7 C 32 10.5, 64 11.5, 104 7.5 C 132 4.6, 152 3.8, 168 4.4 C 152 5.6, 130 7.2, 104 9.6 C 66 13, 30 12, 4 7 Z" />
            <ellipse cx="7" cy="7.6" rx="2.4" ry="1.3" />
        </svg>
    </span>
)
