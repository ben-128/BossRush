Shader "Sprites/GouachePostProcess"
{
    Properties
    {
        [PerRendererData] _MainTex ("Sprite Texture", 2D) = "white" {}
        _Color ("Tint", Color) = (1,1,1,1)

        [Header(Canvas Texture Overlay)]
        _CanvasTex ("Canvas/Paper Texture", 2D) = "white" {}
        _CanvasStrength ("Canvas Strength", Range(0,0.5)) = 0.12

        [Header(Grain Noise)]
        _GrainStrength ("Grain Strength", Range(0,0.3)) = 0.06
        _GrainScale ("Grain Scale", Range(1,200)) = 80

        [Header(UV Displacement)]
        _DisplaceTex ("Displacement Map (brushstroke texture)", 2D) = "gray" {}
        _DisplaceStrength ("Displace Strength", Range(0,0.01)) = 0.003

        [Header(Color Grading)]
        _Desaturation ("Desaturation", Range(0,0.5)) = 0.08
        _TintShift ("Color Tint Shift", Color) = (0.5,0.55,0.65,1)
        _TintStrength ("Tint Strength", Range(0,0.3)) = 0.08

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
        Blend SrcAlpha OneMinusSrcAlpha

        Pass
        {
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
            };

            sampler2D _MainTex;
            float4 _MainTex_ST;
            fixed4 _Color;

            sampler2D _CanvasTex;
            float4 _CanvasTex_ST;
            half _CanvasStrength;

            half _GrainStrength;
            half _GrainScale;

            sampler2D _DisplaceTex;
            float4 _DisplaceTex_ST;
            half _DisplaceStrength;

            half _Desaturation;
            fixed4 _TintShift;
            half _TintStrength;

            // Simple hash-based noise (no external texture needed)
            float hash(float2 p)
            {
                float3 p3 = frac(float3(p.xyx) * 0.1031);
                p3 += dot(p3, p3.yzx + 33.33);
                return frac((p3.x + p3.y) * p3.z);
            }

            v2f vert(appdata_t IN)
            {
                v2f OUT;
                OUT.vertex = UnityObjectToClipPos(IN.vertex);
                OUT.texcoord = IN.texcoord;
                OUT.color = IN.color * _Color;
                #ifdef PIXELSNAP_ON
                OUT.vertex = UnityPixelSnap(OUT.vertex);
                #endif
                return OUT;
            }

            fixed4 frag(v2f IN) : SV_Target
            {
                float2 uv = IN.texcoord;

                // --- 1. UV Displacement (brushstroke distortion) ---
                float2 displaceUV = uv * _DisplaceTex_ST.xy + _DisplaceTex_ST.zw;
                float2 displace = tex2D(_DisplaceTex, displaceUV).rg - 0.5;
                uv += displace * _DisplaceStrength;

                // --- 2. Sample main sprite ---
                fixed4 col = tex2D(_MainTex, uv) * IN.color;

                // --- 3. Canvas texture overlay (multiply) ---
                float2 canvasUV = IN.texcoord * _CanvasTex_ST.xy + _CanvasTex_ST.zw;
                fixed4 canvas = tex2D(_CanvasTex, canvasUV);
                col.rgb = lerp(col.rgb, col.rgb * canvas.rgb, _CanvasStrength);

                // --- 4. Film grain noise ---
                float2 grainCoord = IN.texcoord * _GrainScale + _Time.y * 0.7;
                float grain = hash(grainCoord) - 0.5;
                col.rgb += grain * _GrainStrength;

                // --- 5. Color grading: desaturation ---
                float lum = dot(col.rgb, float3(0.299, 0.587, 0.114));
                col.rgb = lerp(col.rgb, float3(lum, lum, lum), _Desaturation);

                // --- 6. Color grading: tint shift ---
                col.rgb = lerp(col.rgb, col.rgb * _TintShift.rgb * 2.0, _TintStrength);

                return col;
            }
            ENDCG
        }
    }
}
