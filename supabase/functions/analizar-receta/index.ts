import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. EL NAVEGADOR PREGUNTA: "¿Puedo pasar?"
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. BUSCAMOS LA LLAVE DE GEMINI
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) throw new Error('Falta la API Key en Supabase')

    // 3. RECIBIMOS LA IMAGEN
    const { image } = await req.json()
    if (!image) throw new Error('No llegó ninguna imagen')

    // 4. LLAMAMOS A GOOGLE GEMINI
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Extrae medicamentos en JSON: [{Eres un asistente JSON. Extrae los medicamentos de la imagen. Responde ÚNICAMENTE con un Array JSON puro, sin markdown (```json), sin explicaciones y sin texto adicional. Formato: [{nombre, dosis, frecuencia(num), dias(num), notas}], dosis, frecuencia(num), dias(num), notas}]" },
              { inline_data: { mime_type: 'image/jpeg', data: image } }
            ]
          }]
        })
      }
    )

    const data = await response.json()

    // 5. RESPONDEMOS "SÍ" AL NAVEGADOR (CON PERMISOS CORS)
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    // 6. SI FALLA, TAMBIÉN RESPONDEMOS CON PERMISOS (Para ver el error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
