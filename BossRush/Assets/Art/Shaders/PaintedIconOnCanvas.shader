// Icône blanche posée sur un fond peint (dos de carte, background peinture).
// Fait 3 choses pour que l'icône lise comme de la peinture sur peinture et pas
// comme un sticker :
//   1) Tint ivoire (pas blanc pur) pour casser le côté plastic UI
//   2) Multiply subtil avec le VRAI fond derrière (GrabPass) → les craquelures
//      et variations tonales du support transparaissent sur le blanc
//   3) Edge alpha noise → casse le contour vectoriel, bord peint à la main
//
// Le drop shadow est géré séparément par le composant SpriteDropShadow.cs
// (GameObject enfant avec offset + shadowColor).
//
// Usage :
//   - Créer un Material avec ce shader
//   - Assigner le sprite icône blanche
//   - Régler _Tint, _BgBlend et _EdgeNoiseStrength dans l'inspecteur
//   - Le fond sur lequel l'icône se pose DOIT être rendu AVANT (sorting order
//     inférieur), sinon le GrabPass récupère du vide.

Shader "Sprites/PaintedIconOnCanvas"
{
    Properties
    {
        [PerRendererData] _MainTex ("Sprite Texture", 2D) = "white" {}
        _Color ("Sprite Tint (per renderer)", Color) = (1,1,1,1)

        [Header(Paint Look)]
        _PaintTint ("Paint Tint (ivory)", Color) = (0.949, 0.918, 0.875, 1)
        _BgBlend ("Background Multiply Strength", Range(0, 0.6)) = 0.18

        [Header(Edge)]
        _EdgeNoiseTex ("Edge Noise Texture (grayscale)", 2D) = "gray" {}
        _EdgeNoiseStrength ("Edge Noise Strength (UV jitter)", Range(0, 0.5)) = 0.15
        _EdgeNoiseScale ("Edge Noise UV Scale", Range(1, 300)) = 60

        [MaterialToggle] PixelSnap ("Pixel snap", Float) = 0
    }

    SubShader
    {
        Tags
        {
            "Queue"="Transparent"
            "IgnoreProjector"="True"
            "RenderType"="Transparent"
            "PreviewType"="Plane"
            "CanUseSpriteAtlas"="True"
        }

        Cull Off
        Lighting Off
        ZWrite Off

        // Récupère ce qui est déjà rendu derrière (le fond peint du dos de carte).
        GrabPass { "_GrabBG" }

        Pass
        {
            Blend SrcAlpha OneMinusSrcAlpha

            CGPROGRAM
            #pragma vertex vert
            #pragma fragment frag
            #pragma multi_compile _ PIXELSNAP_ON
            #include "UnityCG.cginc"

            struct appdata_t
            {
                float4 vertex   : POSITION;
                float4 color    : COLOR;
                float2 texcoord : TEXCOORD0;
            };

            struct v2f
            {
                float4 vertex   : SV_POSITION;
                fixed4 color    : COLOR;
                float2 texcoord : TEXCOORD0;
                float4 grabPos  : TEXCOORD1;
            };

            sampler2D _MainTex;
            sampler2D _GrabBG;
            sampler2D _EdgeNoiseTex;
            fixed4 _Color;
            fixed4 _PaintTint;
            half _BgBlend;
            half _EdgeNoiseStrength;
            half _EdgeNoiseScale;

            v2f vert(appdata_t IN)
            {
                v2f OUT;
                OUT.vertex = UnityObjectToClipPos(IN.vertex);
                OUT.texcoord = IN.texcoord;
                OUT.color = IN.color * _Color;
                OUT.grabPos = ComputeGrabScreenPos(OUT.vertex);
                #ifdef PIXELSNAP_ON
                OUT.vertex = UnityPixelSnap(OUT.vertex);
                #endif
                return OUT;
            }

            fixed4 frag(v2f IN) : SV_Target
            {
                // 1) Edge noise : déplace les UV de sampling avec 2 samples
                //    décorrélés du noise → le CONTOUR devient crénelé/peint,
                //    quel que soit la netteté des bords du sprite source.
                //    (L'intérieur reste blanc, donc un jitter UV à l'intérieur
                //     est invisible ; seul le bord change de position.)
                float2 noiseUV = IN.texcoord * _EdgeNoiseScale;
                half nx = tex2D(_EdgeNoiseTex, noiseUV).r - 0.5;
                half ny = tex2D(_EdgeNoiseTex, noiseUV + float2(0.37, 0.71)).r - 0.5;
                float2 jitter = float2(nx, ny) * _EdgeNoiseStrength * 0.04;
                float2 sampleUV = IN.texcoord + jitter;

                // Sample icône (avec jitter)
                fixed4 icon = tex2D(_MainTex, sampleUV);

                // 2) Tint ivoire appliqué sur le blanc de l'icône
                fixed3 painted = icon.rgb * _PaintTint.rgb;

                // 3) Multiply subtil avec le fond derrière (GrabPass)
                //    Modulé par alpha pour ne pas noircir les zones transparentes.
                fixed4 bg = tex2Dproj(_GrabBG, IN.grabPos);
                painted = lerp(painted, painted * bg.rgb, _BgBlend * icon.a);

                return fixed4(painted * IN.color.rgb, icon.a * IN.color.a * _PaintTint.a);
            }
            ENDCG
        }
    }

    Fallback "Sprites/Default"
}
