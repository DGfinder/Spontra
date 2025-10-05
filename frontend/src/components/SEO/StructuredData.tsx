import type { Thing, WithContext } from 'schema-dts'

interface StructuredDataProps {
  data: WithContext<Thing> | WithContext<Thing>[]
}

/**
 * Component to render schema.org structured data as JSON-LD
 *
 * Usage:
 * <StructuredData data={destinationSchema} />
 * <StructuredData data={[destinationSchema, breadcrumbSchema]} />
 */
export function StructuredData({ data }: StructuredDataProps) {
  const schemas = Array.isArray(data) ? data : [data]

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 0) // Minified JSON
          }}
        />
      ))}
    </>
  )
}
