import type { Meta, StoryObj } from "@storybook/nextjs";
import { typographyStyles } from "./typographyStyles";

const meta = {
  title: "Foundations/Typography",
  parameters: {
    layout: "fullscreen"
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Reference: Story = {
  render: () => (
    <main className="min-h-screen bg-page px-4 py-8 text-ink md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-line pb-6">
          <p className="m-0 font-display text-2xl uppercase leading-none tracking-normal text-brass">
            Foundations
          </p>
          <h1 className="mt-3 mb-0 font-display text-6xl uppercase leading-none tracking-normal text-title md:text-7xl">
            Typography
          </h1>
          <p className="mt-4 mb-0 max-w-3xl text-xl leading-relaxed text-muted">
            Use these semantic type styles when creating or reviewing Project
            Mafia components. Copy the Tailwind classes from the row that
            matches the content intent.
          </p>
        </header>

        <section className="mt-8 grid gap-4">
          {typographyStyles.map((style) => (
            <article
              className="rounded-panel border border-line bg-surface-raised p-5"
              key={style.name}
            >
              <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
                <div className="lg:col-span-2">
                  <p className="m-0 text-sm font-medium leading-normal text-faint">
                    {style.name}
                  </p>
                  <p className={`mt-3 mb-0 break-words ${style.className}`}>
                    {style.sample}
                  </p>
                  <p className="mt-4 mb-0 text-base leading-relaxed text-muted">
                    {style.usage}
                  </p>
                </div>

                <dl className="grid gap-3 text-sm leading-normal text-muted sm:grid-cols-2 lg:grid-cols-1">
                  <div>
                    <dt className="font-medium text-faint">Font</dt>
                    <dd className="m-0 text-ink">{style.font}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-faint">Size</dt>
                    <dd className="m-0 text-ink">{style.size}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-faint">Weight</dt>
                    <dd className="m-0 text-ink">{style.weight}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-faint">Line height</dt>
                    <dd className="m-0 text-ink">{style.lineHeight}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-faint">Color</dt>
                    <dd className="m-0 flex items-center gap-2 text-ink">
                      <span
                        className={`h-3 w-3 rounded-control border border-line ${style.colorSwatchClassName}`}
                        aria-hidden="true"
                      />
                      {style.colorToken}
                    </dd>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <dt className="font-medium text-faint">Classes</dt>
                    <dd className="m-0 break-all font-mono text-xs leading-relaxed text-ink">
                      {style.className}
                    </dd>
                  </div>
                </dl>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
};
